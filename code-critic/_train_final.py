"""Final training — runs completely independently."""
import sys, os, time, json
os.chdir(r'C:\Users\jacks\OneDrive\Desktop\agnt-evo\code-critic')

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN
from model_v3 import CodeCriticV3, save_model, count_params, load_model

log = open('_final_log.txt', 'w', buffering=1)
def p(*args): print(*args); log.write(' '.join(str(a) for a in args) + '\n')

p("FINAL TRAINING")
t0 = time.time()

# Load pre-generated data
toks = np.load('_train_toks.npy')
feat = np.load('_train_feat.npy')
qual = np.load('_train_qual.npy')
issues = np.load('_train_issues.npy')
p(f"Data: {toks.shape} {feat.shape}")
p(f"Quality: mean={qual.mean():.3f} range=[{qual.min():.3f},{qual.max():.3f}]")

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
p(f"Model: {count_params(m):,} params")

E = 50; LR = 3e-4
opt = optim.AdamW(m.parameters(), lr=LR, weight_decay=0.01)
sch = optim.lr_scheduler.OneCycleLR(opt, max_lr=LR, epochs=E, steps_per_epoch=len(TL), pct_start=0.1)
ql = nn.HuberLoss(delta=0.12)
il = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([2.5, 1.5, 1.5, 3.0, 1.2, 1.3]))

best = float('inf')
for ep in range(E):
    m.train(); tl, tb = 0.0, 0
    for bt,bf,bq,bi in TL:
        opt.zero_grad()
        o = m(bt, bf, 0.0)
        lq = ql(o["quality_score"], bq); li = il(o["issue_logits"], bi)
        with torch.no_grad():
            pp = torch.sigmoid(o["issue_logits"]); tc = 1.0 - (pp-bi).abs().mean(dim=1)
        lc = nn.functional.mse_loss(o["confidence"], tc)
        l = lq + 0.5*li + 0.1*lc
        if torch.isnan(l): continue
        l.backward(); torch.nn.utils.clip_grad_norm_(m.parameters(), 0.5)
        opt.step(); sch.step()
        tl += l.item(); tb += 1

    if (ep+1)%5==0 or ep==0:
        m.eval(); vl,vb = 0.0,0
        with torch.no_grad():
            for vt,vf,vq,vi in VL:
                vl += ql(m(vt,vf,0.0)["quality_score"],vq).item() + 0.5*il(m(vt,vf,0.0)["issue_logits"],vi).item()
                vb+=1
        vl/=max(vb,1)
        p(f"Epoch {ep+1:3d}/{E}  val={vl:.4f}  best={best:.4f}  {(time.time()-t0):.0f}s")
        if vl < best: best = vl; save_model(m, "code_critic_v3.pt")

save_model(m, "code_critic_v3.pt")
p(f"\nTraining done: {(time.time()-t0):.0f}s")

# Test
p("\nCOMPREHENSIVE TEST")
m = load_model("code_critic_v3.pt")
tok = CodeTokenizer(max_length=MAX_SEQ_LEN)

tests = [
    ("good_fib", 'def fibonacci(n: int) -> int:\n    """Return nth Fibonacci."""\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b'),
    ("good_class", 'class Stack:\n    def __init__(self):\n        self._items: list = []\n    def push(self, item):\n        self._items.append(item)\n    def pop(self):\n        if not self._items:\n            raise IndexError("empty")\n        return self._items.pop()'),
    ("good_path", 'from pathlib import Path\ndef load_json(path):\n    p = Path(path)\n    if not p.exists():\n        raise FileNotFoundError(path)\n    return json.loads(p.read_text())'),
    ("good_ctxmgr", 'from contextlib import contextmanager\n@contextmanager\ndef managed(path):\n    f = open(path)\n    try:\n        yield f\n    finally:\n        f.close()'),
    ("bug_divide", 'def divide(a, b):\n    return a / b'),
    ("bug_bare_except", 'def safe_exec(code):\n    try:\n        return eval(code)\n    except:\n        return None'),
    ("bug_mutable_def", 'def append_item(item, lst=[]):\n    lst.append(item)\n    return lst'),
    ("sec_system", 'import os\ndef run(cmd):\n    os.system(cmd)'),
    ("sec_secret", 'API_KEY = "sk-1234567890"\nDB_PASSWORD = "supersecret123"'),
    ("sec_sqlinj", 'def get_user(uid):\n    return db.execute("SELECT * FROM users WHERE id = " + uid)'),
    ("sec_pickle", 'import pickle\ndef load(data):\n    return pickle.loads(data)'),
    ("style_terrible", 'def f(x,y,z):\n  a=x+y\n  b=a*z\n  return b'),
    ("style_camelCase", 'def CalculateTotalPrice(itemList,taxRate):\n    total=0\n    for item in itemList:\n        total+=item.price\n    return total*(1+taxRate)'),
    ("perf_n2", 'def has_dup(lst):\n    for i in range(len(lst)):\n        for j in range(len(lst)):\n            if i != j and lst[i] == lst[j]:\n                return True\n    return False'),
    ("perf_strcat", 'def build_str(items):\n    r = ""\n    for i in items:\n        r += str(i)\n    return r'),
    ("perf_fib", 'def fib(n):\n    if n<=1: return n\n    return fib(n-1)+fib(n-2)'),
    ("maint_deep", 'def process(data):\n    result=[]\n    for i in range(len(data)):\n        if data[i]!=None:\n            if type(data[i])==int:\n                if data[i]>0:\n                    if data[i]%2==0:\n                        result.append(data[i]*2)\n    return result'),
    ("pyth_contains", 'def contains(hay, needle):\n    found=False\n    for i in range(len(hay)):\n        if hay[i]==needle: found=True\n    return found'),
    ("pyth_max", 'def get_max(lst):\n    m=lst[0]\n    for i in range(len(lst)):\n        if lst[i]>m: m=lst[i]\n    return m'),
    ("pyth_even", 'def is_even(n):\n    if n%2==0: return True\n    else: return False'),
]

results = []
p(f"\n{'Test':<22} {'Quality':>8} {'Conf':>6}  bugs style perf  sec  main py")
p("-"*80)
for name, code in tests:
    tokens = tok.encode(code)
    feats = extract_features(code)
    with torch.no_grad():
        out = m.predict(torch.from_numpy(tokens).unsqueeze(0), torch.from_numpy(feats).unsqueeze(0).float())
    q = out["quality_score"].item()
    c = out["confidence"].item()
    p = torch.softmax(out["issue_logits"], dim=-1).squeeze(0).numpy()
    p(f"{name:<22} {q:>8.3f} {c:>6.3f}  {p[0]:.2f}  {p[1]:.2f}  {p[2]:.2f}  {p[3]:.2f}  {p[4]:.2f} {p[5]:.2f}")
    results.append({"name": name, "quality": round(q,3), "confidence": round(c,3)})

good = [r for r in results if r["name"].startswith("good")]
bad = [r for r in results if not r["name"].startswith("good")]
p(f"\nGood code mean quality: {np.mean([r['quality'] for r in good]):.3f}")
p(f"Bad code mean quality:  {np.mean([r['quality'] for r in bad]):.3f}")
p(f"Separation: {np.mean([r['quality'] for r in good]) - np.mean([r['quality'] for r in bad]):.3f}")
p(f"\nTotal time: {(time.time()-t0):.0f}s")
p("DONE!")
log.close()
