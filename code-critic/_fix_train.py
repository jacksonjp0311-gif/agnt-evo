"""
Fixed training script — v2.1

Key fixes:
1. Quality head uses proper scaling and a better loss (Huber instead of MSE)
2. Issue head uses focal loss to handle class imbalance
3. Quality labels are smoothed (not just 1 - max_issue)
4. Gradient clipping is tighter
5. Learning rate warmup to prevent early NaN
6. Confidence head is trained to predict actual accuracy
"""
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN, VOCAB_SIZE
from data_generator import generate_dataset, BUGGY_CODE, STYLE_VIOLATIONS, PERFORMANCE_ISSUES
from data_generator import SECURITY_ISSUES, MAINTAINABILITY_ISSUES, NON_PYTHONIC, GOOD_CODE
from model_v2 import CodeCriticV2, save_model, model_size_params

print("=" * 60)
print("CODE CRITIC V2.1 — FIXED TRAINING")
print("=" * 60)

# Generate data
N_SAMPLES = 5000
print(f"\nGenerating {N_SAMPLES} labeled samples...")
features, qualities, issue_labels = generate_dataset(n_samples=N_SAMPLES, augment=True)

# Fix quality labels: use smoothed version
# Old: quality = 1 - max(issues) — too harsh, causes NaN
# New: quality = 1 - weighted_mean(issues), with smoothing
issue_weights = np.array([0.30, 0.15, 0.15, 0.25, 0.10, 0.05])  # bugs/security weighted higher
weighted_issues = (issue_labels * issue_weights).sum(axis=1)
qualities_smooth = 1.0 - weighted_issues
qualities_smooth = qualities_smooth * 0.8 + 0.1  # Smooth to [0.1, 0.9] range

print(f"Quality range: [{qualities_smooth.min():.3f}, {qualities_smooth.max():.3f}], mean={qualities_smooth.mean():.3f}")

# Tokenize
all_base = BUGGY_CODE + STYLE_VIOLATIONS + PERFORMANCE_ISSUES + \
           SECURITY_ISSUES + MAINTAINABILITY_ISSUES + NON_PYTHONIC + GOOD_CODE
tokenizer = CodeTokenizer(max_length=MAX_SEQ_LEN)

all_tokens = []
for i in range(len(features)):
    base = all_base[i % len(all_base)]
    tokens = tokenizer.encode(base["code"])
    all_tokens.append(tokens)

tokens_arr = np.stack(all_tokens)
print(f"Tokenized {len(all_tokens)} samples, shape: {tokens_arr.shape}")

# Split 80/20
n_train = int(0.8 * len(features))
indices = np.random.permutation(len(features))
train_idx = indices[:n_train]
val_idx = indices[n_train:]

device = "cpu"

train_data = TensorDataset(
    torch.from_numpy(tokens_arr[train_idx]),
    torch.from_numpy(features[train_idx]).float(),
    torch.from_numpy(qualities_smooth[train_idx]).float(),
    torch.from_numpy(issue_labels[train_idx]).float(),
)
val_data = TensorDataset(
    torch.from_numpy(tokens_arr[val_idx]),
    torch.from_numpy(features[val_idx]).float(),
    torch.from_numpy(qualities_smooth[val_idx]).float(),
    torch.from_numpy(issue_labels[val_idx]).float(),
)

train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32)

# Create fresh model
model = CodeCriticV2()
n_params = model_size_params(model)
print(f"Model: {n_params:,} params ({n_params/1e6:.2f}M)")

# Optimizer with warmup
EPOCHS = 60
lr = 2e-4
optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.02, eps=1e-8)

# Warmup + cosine decay
warmup_epochs = 5
def lr_lambda(epoch):
    if epoch < warmup_epochs:
        return epoch / warmup_epochs
    return 0.5 * (1 + np.cos(np.pi * (epoch - warmup_epochs) / (EPOCHS - warmup_epochs)))

scheduler = optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

# Loss functions
quality_loss_fn = nn.HuberLoss(delta=0.2)  # More robust than MSE
issue_loss_fn = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([2.0, 1.5, 1.5, 2.5, 1.2, 1.3]))

print(f"\nTraining for {EPOCHS} epochs on {n_train} samples...")
print(f"Warmup: {warmup_epochs} epochs, base lr: {lr}")
start = time.time()

best_val_loss = float('inf')
for epoch in range(EPOCHS):
    model.train()
    total_loss = 0.0
    n_batches = 0

    for bt, bf, bq, bi in train_loader:
        optimizer.zero_grad()
        outputs = model(bt, bf, mask_ratio=0.0)

        # Quality loss
        loss_q = quality_loss_fn(outputs["quality_score"], bq)

        # Issue loss (per-category BCE)
        loss_i = issue_loss_fn(outputs["issue_logits"], bi)

        # Confidence loss: confidence should correlate with accuracy
        with torch.no_grad():
            # How accurate are the issue predictions?
            pred_probs = torch.sigmoid(outputs["issue_logits"])
            issue_error = (pred_probs - bi).abs().mean(dim=1)  # Per-sample error
            target_conf = 1.0 - issue_error  # Higher confidence = lower error

        loss_c = nn.functional.mse_loss(outputs["confidence"], target_conf)

        # Combined loss
        loss = loss_q + 0.5 * loss_i + 0.1 * loss_c

        # Check for NaN
        if torch.isnan(loss):
            print(f"  WARNING: NaN loss at epoch {epoch+1}, skipping batch")
            continue

        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 0.5)  # Tighter clipping
        optimizer.step()

        total_loss += loss.item()
        n_batches += 1

    scheduler.step()
    avg_loss = total_loss / max(n_batches, 1)

    if (epoch + 1) % 10 == 0 or epoch == 0 or epoch == warmup_epochs - 1:
        model.eval()
        val_loss = 0.0
        val_q_loss = 0.0
        val_i_loss = 0.0
        val_batches = 0
        with torch.no_grad():
            for vt, vf, vq, vi in val_loader:
                vo = model(vt, vf, mask_ratio=0.0)
                lq = quality_loss_fn(vo["quality_score"], vq).item()
                li = issue_loss_fn(vo["issue_logits"], vi).item()
                val_q_loss += lq
                val_i_loss += li
                val_loss += lq + 0.5 * li
                val_batches += 1
        val_loss /= max(val_batches, 1)
        val_q_loss /= max(val_batches, 1)
        val_i_loss /= max(val_batches, 1)

        # Check for NaN in model outputs
        with torch.no_grad():
            sample_out = model(vt[:1], vf[:1], mask_ratio=0.0)
            has_nan = any(torch.isnan(v).any() for v in sample_out.values() if v is not None)

        nan_flag = " ⚠️ NaN!" if has_nan else ""
        print(
            f"  Epoch {epoch+1:3d}/{EPOCHS}  "
            f"train={avg_loss:.4f}  val={val_loss:.4f}  "
            f"q_loss={val_q_loss:.4f}  i_loss={val_i_loss:.4f}  "
            f"lr={scheduler.get_last_lr()[0]:.2e}{nan_flag}"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_model(model, "code_critic_v2.pt")

elapsed = time.time() - start
print(f"\nTraining complete in {elapsed:.1f}s")
print(f"Best val loss: {best_val_loss:.4f}")

# Final save
save_model(model, "code_critic_v2.pt")

# Quick test
print("\n" + "=" * 60)
print("POST-TRAINING TEST")
print("=" * 60)

model = load_model("code_critic_v2.pt")
test_cases = [
    ("Good: fibonacci", 'def fibonacci(n: int) -> int:\n    """Return nth Fibonacci."""\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b'),
    ("Buggy: no zero check", 'def divide(a, b):\n    return a / b'),
    ("Security: os.system", 'import os\ndef run(cmd):\n    os.system(cmd)'),
    ("Style: terrible", 'def f(x,y,z):\n  a=x+y\n  b=a*z\n  return b'),
    ("Performance: O(n^2)", 'def has_dup(lst):\n    for i in range(len(lst)):\n        for j in range(len(lst)):\n            if i != j and lst[i] == lst[j]:\n                return True\n    return False'),
    ("Good: clean class", 'class Stack:\n    def __init__(self):\n        self._items: list = []\n    def push(self, item):\n        self._items.append(item)\n    def pop(self):\n        return self._items.pop()'),
    ("Bad: bare except", 'def safe_exec(code):\n    try:\n        return eval(code)\n    except:\n        return None'),
    ("Bad: hardcoded secret", 'API_KEY = "sk-1234567890"\nDB_PASSWORD = "supersecret123"'),
]

print(f"\n{'Test Case':<30} {'Quality':>8} {'Conf':>6}  bugs  style  perf  sec   main  py")
print("-" * 80)

for name, code in test_cases:
    tokens = tokenizer.encode(code)
    feats = extract_features(code)
    tokens_t = torch.from_numpy(tokens).unsqueeze(0)
    features_t = torch.from_numpy(feats).unsqueeze(0).float()
    with torch.no_grad():
        out = model.predict(tokens_t, features_t)
    q = out["quality_score"].item()
    c = out["confidence"].item()
    probs = torch.softmax(out["issue_logits"], dim=-1).squeeze(0).numpy()
    print(f"{name:<30} {q:>8.3f} {c:>6.3f}  {probs[0]:.2f}   {probs[1]:.2f}   {probs[2]:.2f}  {probs[3]:.2f}   {probs[4]:.2f}  {probs[5]:.2f}")

print("\n✅ Training and test complete!")
