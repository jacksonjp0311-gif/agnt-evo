
import torch
import numpy as np
from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN, VOCAB_SIZE
from model_v2 import CodeCriticV2, load_model, model_size_params
from data_generator import generate_dataset, BUGGY_CODE, STYLE_VIOLATIONS, PERFORMANCE_ISSUES
from data_generator import SECURITY_ISSUES, MAINTAINABILITY_ISSUES, NON_PYTHONIC, GOOD_CODE

print("=" * 60)
print("CODE CRITIC V2 — DIAGNOSTIC")
print("=" * 60)

# Load model
model = load_model("code_critic_v2.pt")
n_params = model_size_params(model)
print(f"\nModel: {n_params:,} params")

# Test with different code samples
tokenizer = CodeTokenizer(max_length=MAX_SEQ_LEN)

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

print("\n" + "-" * 60)
print(f"{'Test Case':<30} {'Quality':>8} {'Conf':>6} {'Issue Probs'}")
print("-" * 60)

for name, code in test_cases:
    tokens = tokenizer.encode(code)
    features = extract_features(code)
    
    tokens_t = torch.from_numpy(tokens).unsqueeze(0)
    features_t = torch.from_numpy(features).unsqueeze(0).float()
    
    with torch.no_grad():
        out = model.predict(tokens_t, features_t)
    
    q = out["quality_score"].item()
    c = out["confidence"].item()
    probs = torch.softmax(out["issue_logits"], dim=-1).squeeze(0).numpy()
    
    prob_str = " ".join([f"{p:.2f}" for p in probs])
    print(f"{name:<30} {q:>8.3f} {c:>6.3f}  {prob_str}")

print("\n" + "-" * 60)
print("Issue order: bugs, style, perf, security, maintain, pythonic")
print("-" * 60)

# Check model weight statistics
print("\nModel weight stats:")
for name, param in model.named_parameters():
    if param.requires_grad:
        print(f"  {name}: mean={param.data.mean():.4f}, std={param.data.std():.4f}, norm={param.data.norm():.4f}")

# Check if issue head has any signal
print("\nIssue head bias:")
print(f"  {model.issue_head[-1].bias.data.numpy()}")

# Generate a small dataset and check label distribution
print("\nGenerating 100 samples to check label distribution...")
features, qualities, issue_labels = generate_dataset(n_samples=100, augment=False)
print(f"  Quality range: [{qualities.min():.3f}, {qualities.max():.3f}], mean={qualities.mean():.3f}")
print(f"  Issue label means: {issue_labels.mean(axis=0).round(3)}")
print(f"  Issue label stds:  {issue_labels.std(axis=0).round(3)}")

# Check what the model predicts on the training data
print("\nModel predictions on training data (first 20):")
tokens_list = []
all_base = BUGGY_CODE + STYLE_VIOLATIONS + PERFORMANCE_ISSUES + SECURITY_ISSUES + MAINTAINABILITY_ISSUES + NON_PYTHONIC + GOOD_CODE
for i in range(min(20, len(features))):
    base = all_base[i % len(all_base)]
    t = tokenizer.encode(base["code"])
    tokens_list.append(t)
tokens_arr = np.stack(tokens_list)
with torch.no_grad():
    out = model.predict(torch.from_numpy(tokens_arr), torch.from_numpy(features[:20]).float())
    probs = torch.softmax(out["issue_logits"], dim=-1).numpy()
    for i in range(min(20, len(features))):
        base = all_base[i % len(all_base)]
        print(f"  {base['desc']:<40} q={out['quality_score'][i]:.3f} probs={probs[i].round(2)}")

print("\n✅ Diagnostic complete")
