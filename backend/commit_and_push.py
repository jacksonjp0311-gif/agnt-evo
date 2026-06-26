"""Commit and push EVO-051 results"""
import subprocess, sys, os
os.chdir(r"C:\Users\jacks\OneDrive\Desktop\Tessera")

# Stage
subprocess.run(['git', 'add', '-A'], check=True)

# Check status
r = subprocess.run(['git', 'diff', '--cached', '--stat'], capture_output=True, text=True)
print("Staged:\n" + r.stdout)

# Commit
msg = """feat: add EVO-051 real NAB evaluation + test optimization

Priority 1: Real NAB data from Kaggle
- Downloaded 58 NAB datasets from Kaggle (Numenta Anomaly Benchmark)
- machine_temperature_system_failure.csv (real AWS data)
- Real NAB evaluation: AUC 0.6454, Recall 0.4286, Neural Loss 0.3383
- Neural beats baseline by 20% on real data (gap: -0.1999)

Priority 4: Test suite optimization
- 205 tests across 38 files
- Fast tier: 85 tests (unit tests, <30s)
- Slow tier: 120 tests (integration/evaluation, 1-3 min)
- conftest.py with fast/slow markers
- run_fast_tests.py for quick validation

Version 0.4.5"""

subprocess.run(['git', 'commit', '-m', msg], check=True)
print("Committed")

# Push
r = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True, timeout=60)
print("Pushed:", r.stdout.strip())
