"""Phase 2: Training only — loads pre-generated data, trains, saves model."""
import sys, os, time
sys.stdout = open('_train_only_log.txt', 'w', buffering=1)
sys.stderr = sys.stdout

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from model_v3 import CodeCriticV3, save_model, count_params, load_model
from code_features import extract_features
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN

print("PHASE 2: TRAINING")
print("="*60)

# Load pre-generated data
toks = np.load('_train_toks.npy')
feat = np.load('_train_feat.npy')
qual = np.load('_train_qual.npy')
issues = np.load('_train_issues.npy')
print(f"Loaded: toks={toks.shape} feat={feat.shape} qual={qual.shape} issues={issues.shape}")
print(f"Quality: mean={qual.mean():.3f} range=[{qual.min():.3f},{qual.max():.3f}]")

# Split
n_tr = int(0.8*len(feat))
idx = np.random.permutation(len(feat))
TD = TensorDataset(torch.from_numpy(toks[idx[:n_tr]]), torch.from_numpy(feat[idx[:n_tr]]).float(),
                   torch.from_numpy(qual[idx[:n_tr]]).float(), torch.from_numpy(issues[idx[:n_tr]]).float())
VD = TensorDataset(torch.from_numpy(toks[idx[n_tr:]]), torch.from_numpy(feat[idx[n_tr:]]).float(),
                   torch.from_numpy(qual[idx[n_tr:]]).float(), torch.from_numpy(issues[idx[n_tr:]]).float())
TL = DataLoader(TD, batch_size=64, shuffle=True)
VL = DataLoader(VD, batch_size=64)

m = CodeCriticV3()
print(f"Model: {count_params(m):,} params")

E = 50; LR = 3e-4
opt = optim.AdamW(m.parameters(), lr=LR, weight_decay=0.01)
sch = optim.lr_scheduler.OneCycleLR(opt, max_lr=LR, epochs=E, steps_per_epoch=len(TL), pct_start=0.1)
ql = nn.HuberLoss(delta=0.12)
il = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([2.5, 1.5, 1.5, 3.0, 1.2, 1.3]))

print(f"\nTraining {E} epochs, batch 64, {n_tr} samples...")
t0 = time.time(); best = float('inf')

for ep in range(E):
    m.train(); tl, tb = 0.0, 0
    for bt,bf,bq,bi in TL:
        opt.zero_grad()
        o = m(bt, bf, 0.0)
        lq = ql(o["quality_score"], bq)
        li = il(o["issue_logits"], bi)
        with torch.no_grad():
            pp = torch.sigmoid(o["issue_logits"])
            tc = 1.0 - (pp-bi).abs().mean(dim=1)
        lc = nn.functional.mse_loss(o["confidence"], tc)
        l = lq + 0.5*li + 0.1*lc
        if torch.isnan(l): continue
        l.backward()
        torch.nn.utils.clip_grad_norm_(m.parameters(), 0.5)
        opt.step(); sch.step()
        tl += l.item(); tb += 1
    atl = tl/max(tb,1)

    if (ep+1)%5==0 or ep<3:
        m.eval(); vl,vb,vmae,vn = 0.0,0,0.0,0
        with torch.no_grad():
            for vt,vf,vq,vi in VL:
                vo = m(vt,vf,0.0)
                vl += ql(vo["quality_score"],vq).item() + 0.5*il(vo["issue_logits"],vi).item()
                vmae += (vo["quality_score"]-vq).abs().sum().item()
                vn += vq.shape[0]; vb+=1
        vl/=max(vb,1); vmae/=max(vn,1)
        print(f"  Epoch {ep+1:3d}/{E}  train={atl:.4f}  val={vl:.4f}  mae={vmae:.4f}  lr={sch.get_last_lr()[0]:.2e}")
        if vl < best: best = vl; save_model(m, "code_critic_v3.pt")

print(f"\nDone in {(time.time()-t0):.0f}s  best={best:.4f}")
save_model(m, "code_critic_v3.pt")

# Test
print("\nTEST")
m = load_model("code_critic_v3.pt")
tok = CodeTokenizer(max_length=MAX_SEQ_LEN)
tests = [
    ("good_fib", 'def fibonacci(n: int) -> int:\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b'),
    ("bug_divide", 'def divide(a, b):\n    return a / b'),
    ("sec_system", 'import os\ndef run(cmd):\n    os.system(cmd)'),
    ("style_bad", 'def f(x,y,z):\n  a=x+y\n  b=a*z\n  return b'),
    ("perf_n2", 'def has_dup(lst):\n    for i in range(len(lst)):\n        for j in range(len(lst)):\n            if i != j and lst[i] == lst[j]:\n                return True\n    return False'),
    ("good_class", 'class Stack:\n    def __init__(self):\n        self._items: list = []\n    def push(self, item):\n        self._items.append(item)\n    def pop(self):\n        if not self._items:\n            raise IndexError("empty")\n        return self._items.pop()'),
    ("sec_secret", 'API_KEY = "sk-1234567890"\nDB_PASSWORD = "supersecret123"'),
    ("bug_eval", 'def safe_exec(code):\n    try:\n        return eval(code)\n    except:\n        return None'),
    ("good_path", 'from pathlib import Path\ndef load(p): return json.loads(Path(p).read_text())'),
    ("sql_inj", 'def get_user(uid):\n    return db.execute("SELECT * FROM users WHERE id = " + uid)'),
]

print(f"\n{'Test':<20} {'Quality':>8} {'Conf':>6}  bugs style perf  sec  main py")
print("-"*75)
for name, code in tests:
    tokens = tok.encode(code)
    feats = extract_features(code)
    with torch.no_grad():
        out = m.predict(torch.from_numpy(tokens).unsqueeze(0), torch.from_numpy(feats).unsqueeze(0).float())
    q = out["quality_score"].item()
    c = out["confidence"].item()
    p = torch.softmax(out["issue_logits"], dim=-1).squeeze(0).numpy()
    print(f"{name:<20} {q:>8.3f} {c:>6.3f}  {p[0]:.2f}  {p[1]:.2f}  {p[2]:.2f}  {p[3]:.2f}  {p[4]:.2f} {p[5]:.2f}")
print("\nDONE!")
sys.stdout.close()
