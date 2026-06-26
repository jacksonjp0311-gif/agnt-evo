import os
os.chdir(r'C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\chemiframe')
print('DELIVERY CHECK', flush=True)
# Docs
assert os.path.exists('README.md')
assert os.path.exists('SCOPE_AND_ROADMAP.md')
assert os.path.exists('REACT_DATABASE_INTEGRATION_SPEC.md')
# Tools
for f in ['chemiframe-compile.js','chemiframe-validate.js','chemiframe-simulate.js',
'chemiframe-retrosynthesis.js','chemiframe-execute.js','chemiframe-demo.js',
'chemiframe-blueprints.js','chemiframe-check-env.js','chemiframe-quickstart.js']:
  assert os.path.exists(f)
# Python
assert os.path.isdir('chemiframe_py')
for d in ['intent','blueprints','planner','compiler','verify','runtime','adapters']:
  assert os.path.isdir('chemiframe_py/'+d)
# Package
import json
with open('manifest.json') as f: json.load(f)
with open('package.json') as f: json.load(f)
assert os.path.exists('.agnt-plugin.json')
print('ALL VERIFIED SUCCESSFULLY', flush=True)