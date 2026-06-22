"""
Focused retraining — just the quality and confidence heads.
The issue classifier is already good (from diagnostic).
"""
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN
from model_v2 import CodeCriticV2, save_model, model_size_params

print("=" * 60)
print("FOCUSED FIX — retrain quality + confidence heads")
print("=" * 60)

# Load the existing model (issue classifier is already good)
model = CodeCriticV2()
print("Model: {:,} params".format(model_size_params(model)))

# Reinitialize quality and confidence heads
print("\nReinitializing quality and confidence heads...")
for layer in model.quality_head:
    if hasattr(layer, 'weight'):
        nn.init.xavier_uniform_(layer.weight)
        if layer.bias is not None:
            nn.init.zeros_(layer.bias)
for layer in model.confidence_head:
    if hasattr(layer, 'weight'):
        nn.init.xavier_uniform_(layer.weight)
        if layer.bias is not None:
            nn.init.zeros_(layer.bias)

# Freeze everything except quality and confidence heads
for name, param in model.named_parameters():
    param.requires_grad = False
for name, param in model.named_parameters():
    if 'quality_head' in name or 'confidence_head' in name:
        param.requires_grad = True
        print("  Trainable: " + name)

# Generate data
from data_generator import generate_dataset, BUGGY_CODE, STYLE_VIOLATIONS, PERFORMANCE_ISSUES
from data_generator import SECURITY_ISSUES, MAINTAINABILITY_ISSUES, NON_PYTHONIC, GOOD_CODE

print("\nGenerating 2000 samples...")
features, qualities, issue_labels = generate_dataset(n_samples=2000, augment=True)

# Better quality labels
issue_weights = np.array([0.30, 0.10, 0.15, 0.25, 0.10, 0.10])
weighted_issues = (issue_labels * issue_weights).sum(axis=1)
qualities_smooth = 1.0 - weighted_issues
qualities_smooth = qualities_smooth * 0.75 + 0.125

print("Quality range: [{:.3f}, {:.3f}], mean={:.3f}".format(
    qualities_smooth.min(), qualities_smooth.max(), qualities_smooth.mean()))

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

n_train = int(0.8 * len(features))
train_data = TensorDataset(
    torch.from_numpy(tokens_arr[:n_train]),
    torch.from_numpy(features[:n_train]).float(),
    torch.from_numpy(qualities_smooth[:n_train]).float(),
    torch.from_numpy(issue_labels[:n_train]).float(),
)
val_data = TensorDataset(
    torch.from_numpy(tokens_arr[n_train:]),
    torch.from_numpy(features[n_train:]).float(),
    torch.from_numpy(qualities_smooth[n_train:]).float(),
    torch.from_numpy(issue_labels[n_train:]).float(),
)
train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32)

optimizer = torch.optim.AdamW(
    [p for p in model.parameters() if p.requires_grad],
    lr=5e-4, weight_decay=0.01
)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)
quality_loss_fn = nn.HuberLoss(delta=0.15)
issue_loss_fn = nn.BCEWithLogitsLoss()

print("\nTraining for 30 epochs (heads only)...")
for epoch in range(30):
    model.train()
    total_loss = 0.0
    n_batches = 0
    for bt, bf, bq, bi in train_loader:
        optimizer.zero_grad()
        outputs = model(bt, bf, mask_ratio=0.0)
        loss_q = quality_loss_fn(outputs["quality_score"], bq)
        with torch.no_grad():
            pred_probs = torch.sigmoid(outputs["issue_logits"])
            issue_error = (pred_probs - bi).abs().mean(dim=1)
            target_conf = 1.0 - issue_error
        loss_c = nn.functional.mse_loss(outputs["confidence"], target_conf)
        loss_i = issue_loss_fn(outputs["issue_logits"], bi)
        loss = loss_q + 0.3 * loss_i + 0.2 * loss_c
        if torch.isnan(loss):
            continue
        loss.backward()
        torch.nn.utils.clip_grad_norm_(
            [p for p in model.parameters() if p.requires_grad], 0.5)
        optimizer.step()
        total_loss += loss.item()
        n_batches += 1
    scheduler.step()
    avg_loss = total_loss / max(n_batches, 1)

    if (epoch + 1) % 5 == 0 or epoch == 0:
        model.eval()
        val_q_loss = 0.0
        val_batches = 0
        qp, qt, cp = [], [], []
        with torch.no_grad():
            for vt, vf, vq, vi in val_loader:
                vo = model(vt, vf, mask_ratio=0.0)
                val_q_loss += quality_loss_fn(vo["quality_score"], vq).item()
                qp.extend(vo["quality_score"].tolist())
                qt.extend(vq.tolist())
                cp.extend(vo["confidence"].tolist())
                val_batches += 1
        val_q_loss /= max(val_batches, 1)
        qp, qt = np.array(qp), np.array(qt)
        corr = np.corrcoef(qp, qt)[0, 1] if qp.std() > 0.01 else 0.0
        print("  Epoch {:2d}/30  train={:.4f}  q_loss={:.4f}  q_corr={:.3f}  q_range=[{:.2f},{:.2f}]  conf={:.3f}".format(
            epoch+1, avg_loss, val_q_loss, corr, qp.min(), qp.max(), np.mean(cp)))

# Save
save_model(model, "code_critic_v2.pt")
print("\nModel saved: code_critic_v2.pt")

# Test
print("\n" + "=" * 60)
print("POST-FIX TEST")
print("=" * 60)

test_cases = [
    ("Good: fibonacci", 'def fibonacci(n: int) -> int:\n    """Return nth Fibonacci."""\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b'),
    ("Buggy: no zero check", 'def divide(a, b):\n    return a / b'),
    ("Security: os.system", 'import os\ndef run(cmd):\n    os.system(cmd)'),
    ("Style: terrible", 'def f(x,y,z):\n  a=x+y\n  b=a*z\n  return b'),
    ("Performance: O(n^2)", 'def has_dup(lst):\n    for i in range(len(lst)):\n        for j in range(len(lst)):\n            if i != j and lst[i] == lst[j]:\n                return True\n    return False'),
    ("Good: clean class", 'class Stack:\n    def __init__(self):\n        self._items: list = []\n    def push(self, item):\n        self._items.append(item)\n    def pop(self):\n        return self._items.pop()'),
    ("Bad: bare except + eval", 'def safe_exec(code):\n    try:\n        return eval(code)\n    except:\n        return None'),
    ("Bad: hardcoded secret", 'API_KEY = "sk-1234567890"\nDB_PASSWORD = "supersecret123"'),
    ("Good: path handling", 'from pathlib import Path\ndef load_json(path: str) -> dict:\n    p = Path(path)\n    if not p.exists():\n        raise FileNotFoundError(path)\n    return json.loads(p.read_text())'),
    ("Bad: deep nesting", 'def process(data):\n    result = []\n    for i in range(len(data)):\n        if data[i] != None:\n            if type(data[i]) == int:\n                if data[i] > 0:\n                    if data[i] % 2 == 0:\n                        result.append(data[i] * 2)\n    return result'),
    ("SQL injection", 'def get_user(user_id):\n    query = "SELECT * FROM users WHERE id = " + user_id\n    return db.execute(query)'),
    ("Good: context manager", 'from contextlib import contextmanager\n@contextmanager\ndef managed_resource(path):\n    f = open(path)\n    try:\n        yield f\n    finally:\n        f.close()'),
]

print("\n{:<30} {:>8} {:>6}  bugs style perf  sec  main py".format("Test Case", "Quality", "Conf"))
print("-" * 85)

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
    print("{:<30} {:>8.3f} {:>6.3f}  {:.2f}  {:.2f}  {:.2f}  {:.2f}  {:.2f} {:.2f}".format(
        name, q, c, probs[0], probs[1], probs[2], probs[3], probs[4], probs[5]))

print("\nFix complete!")
