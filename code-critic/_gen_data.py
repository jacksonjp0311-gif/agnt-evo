"""Phase 1: Generate and save training data."""
import sys, os, time, numpy as np
sys.stdout = open('_gen_data_log.txt', 'w', buffering=1)
sys.stderr = sys.stdout

from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN
from data_generator import generate_dataset, BUGGY_CODE, STYLE_VIOLATIONS, PERFORMANCE_ISSUES
from data_generator import SECURITY_ISSUES, MAINTAINABILITY_ISSUES, NON_PYTHONIC, GOOD_CODE

N = 5000
print(f"Generating {N} samples...")
feat, qual, issues = generate_dataset(n_samples=N, augment=True)

w = np.array([0.30, 0.10, 0.15, 0.25, 0.10, 0.10])
severity = (issues * w).sum(axis=1)
qual = 0.92 - 0.87 * severity + np.random.normal(0, 0.015, len(severity))
qual = np.clip(qual, 0.02, 0.98)
print(f"Quality: mean={qual.mean():.3f} range=[{qual.min():.3f},{qual.max():.3f}]")

all_base = BUGGY_CODE+STYLE_VIOLATIONS+PERFORMANCE_ISSUES+SECURITY_ISSUES+MAINTAINABILITY_ISSUES+NON_PYTHONIC+GOOD_CODE
tok = CodeTokenizer(max_length=MAX_SEQ_LEN)
print(f"Tokenizing {len(feat)} samples...")
toks = np.stack([tok.encode(all_base[i%len(all_base)]["code"]) for i in range(len(feat))])
print(f"Tokens: {toks.shape}")

# Save all data
np.save('_train_toks.npy', toks)
np.save('_train_feat.npy', feat)
np.save('_train_qual.npy', qual)
np.save('_train_issues.npy', issues)
print("Data saved!")
print(f"Files: _train_toks.npy({toks.shape}), _train_feat.npy({feat.shape}), _train_qual.npy({qual.shape}), _train_issues.npy({issues.shape})")
sys.stdout.close()
