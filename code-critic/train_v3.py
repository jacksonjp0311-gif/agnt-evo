"""
train_v3.py — Clean training script for CodeCriticV3.

Fixes:
  - Quality labels: PROPER weighted combo, not 1-max
  - Loss: Huber for quality, weighted BCE for issues
  - Schedule: warmup + cosine, 60 epochs, batch 64
"""
import sys, os, time, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN
from data_generator import generate_dataset, BUGGY_CODE, STYLE_VIOLATIONS, PERFORMANCE_ISSUES
from data_generator import SECURITY_ISSUES, MAINTAINABILITY_ISSUES, NON_PYTHONIC, GOOD_CODE
from model_v3 import CodeCriticV3, save_model, count_params

print("="*60)
print("CODE CRITIC V3 — TRAINING")
print("="*60)

# Generate data
N = 8000
print(f"\nGenerating {N} samples...")
feat, qual, issues = generate_dataset(n_samples=N, augment=True)

# PROPER quality labels
w = np.array([0.30, 0.10, 0.15, 0.25, 0.10, 0.10])
severity = (issues * w).sum(axis=1)
qual = 0.92 - 0.87 * severity + np.random.normal(0, 0.015, len(severity))
qual = np.clip(qual, 0.02, 0.98)
print(f"Quality: mean={qual.mean():.3f} range=[{qual.min():.3f},{qual.max():.3f}]")
print(f"Issues: {issues.mean(axis=0).round(3)}")

# Tokenize
all_base = BUGGY_CODE+STYLE_VIOLATIONS+PERFORMANCE_ISSUES+SECURITY_ISSUES+MAINTAINABILITY_ISSUES+NON_PYTHONIC+GOOD_CODE
tok = CodeTokenizer(max_length=MAX_SEQ_LEN)
toks = np.stack([tok.encode(all_base[i%len(all_base)]["code"]) for i in range(len(feat))])
print(f"Tokens: {toks.shape}")

# Split
n_tr = int(0.8*len(feat))
idx = np.random.permutation(len(feat))
TD = TensorDataset(torch.from_numpy(toks[idx[:n_tr]]), torch.from_numpy(feat[idx[:n_tr]]).float(),
                   torch.from_numpy(qual[idx[:n_tr]]).float(), torch.from_numpy(issues[idx[:n_tr]]).float())
VD = TensorDataset(torch.from_numpy(toks[idx[n_tr:]]), torch.from_numpy(feat[idx[n_tr:]]).float(),
                   torch.from_numpy(qual[idx[n_tr:]]).float(), torch.from_numpy(issues[idx[n_tr:]]).float())
TL = DataLoader(TD, batch_size=64, shuffle=True)
VL = DataLoader(VD, batch_size=64)

# Model
m = CodeCriticV3()
print(f"Model: {count_params(m):,} params")

# Train
EPOCHS = 60
WARMUP = 5
LR = 3e-4
opt = optim.AdamW(m.parameters(), lr=LR, weight_decay=0.01)
sch = optim.optim.lr_scheduler.OneCycleLR(opt, max_lr=LR, epochs=EPOCHS, steps_per_epoch=len(TL), pct_start=WARMUP/EPOCHS)
q_loss = nn.HuberLoss(delta=0.12)
i_loss = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([2.5, 1.5, 1.5, 3.0, 1.2, 1.3]))

print(f"\nTraining {EPOCHS} epochs, batch 64...")
t0 = time.time()
best = float('inf')

for ep in range(EPOCHS):
    m.train()
    tl, tb = 0.0, 0
    for bt,bf,bq,bi in TL:
        opt.zero_grad()
        o = m(bt, bf, 0.0)
        lq = q_loss(o["quality_score"], bq)
        li = i_loss(o["issue_logits"], bi)
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

    if (ep+1)%10==0 or ep<3:
        m.eval(); vl,vb,vmae,vn = 0.0,0,0.0,0
        with torch.no_grad():
            for vt,vf,vq,vi in VL:
                vo = m(vt,vf,0.0)
                vl += q_loss(vo["quality_score"],vq).item() + 0.5*i_loss(vo["issue_logits"],vi).item()
                vmae += (vo["quality_score"]-vq).abs().sum().item()
                vn += vq.shape[0]; vb+=1
        vl/=max(vb,1); vmae/=max(vn,1)
        lr = sch.get_last_lr()[0]
        print(f"  Epoch {ep+1:3d}/{EPOCHS}  train={atl:.4f}  val={vl:.4f}  q_mae={vmae:.4f}  lr={lr:.2e}")
        if vl < best:
            best = vl
            save_model(m, "code_critic_v3.pt")

print(f"\nDone in {(time.time()-t0):.0f}s  best={best:.4f}")
save_model(m, "code_critic_v3.pt")

# Test
print("\n"+"="*60)
print("TEST")
m = load_model("code_critic_v3.pt")
tests = [
    ("good_fib", 'def fibonacci(n: int) -> int:\n    """Return nth Fibonacci."""\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b'),
    ("bug_divide", 'def divide(a, b):\n    return a / b'),
    ("sec_system", 'import os\ndef run(cmd):\n    os.system(cmd)'),
    ("style_bad", 'def f(x,y,z):\n  a=x+y\n  b=a*z\n  return b'),
    ("perf_n2", 'def has_dup(lst):\n    for i in range(len(lst)):\n        for j in range(len(lst)):\n            if i != j and lst[i] == lst[j]:\n                return True\n    return False'),
    ("good_class", 'class Stack:\n    def __init__(self):\n        self._items: list = []\n    def push(self, item):\n        self._items.append(item)\n    def pop(self):\n        if not self._items:\n            raise IndexError("empty")\n        return self._items.pop()'),
    ("sec_secret", 'API_KEY = "sk-1234567890"\nDB_PASSWORD = "supersecret123"'),
    ("bug_eval", 'def safe_exec(code):\n    try:\n        return eval(code)\n    except:\n        return None'),
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
print("\nDone!")
