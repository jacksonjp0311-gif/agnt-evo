import sys, os
os.chdir(r'C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\chemiframe')
print('='*60)
print('CHEMIFRAME AGNT PLUGIN DELIVERY VERIFICATION')
print('='*60)
# Check docs
for d in ['README.md','SCOPE_AND_ROADMAP.md','REACT_DATABASE_INTEGRATION_SPEC.md']:
  assert os.path.exists(d); print('[OK]',d)
# Check tools
for t in ['chemiframe-compile.js','chemiframe-validate.js','chemiframe-simulate.js',
          'chemiframe-retrosynthesis.js','chemiframe-execute.js','chemiframe-demo.js',
          'chemiframe-blueprints.js','chemiframe-check-env.js','chemiframe-quickstart.js']:
  assert os.path.exists(t); print('[OK]',t)
# Check Python
assert os.path.isdir('chemiframe_py')
for p in ['intent','blueprints','planner','compiler','verify','runtime','adapters']:
  assert os.path.isdir('chemiframe_py/'+p); print('[OK] chemiframe_py/',p)
# Check package
import json
with open('manifest.json') as f: json.load(f)
with open('package.json') as f: json.load(f)
print('[OK] manifest.json, package.json')
assert os.path.exists('.agnt-plugin.json'); print('[OK] .agnt-plugin.json')
# Check content
with open('README.md') as f: r=f.read()
assert 'Expansion Plan' in r and '3-Month Roadmap' in r
with open('SCOPE_AND_ROADMAP.md') as f: s=f.read()
assert 'MVP' in s and 'Opentrons OT-2' in s
with open('REACT_DATABASE_INTEGRATION_SPEC.md') as f: sp=f.read()
assert 'PubChem' in sp and '/api/reactions' in sp
print('[OK] All content checks passed')
print('='*60)
print('DELIVERY COMPLETE')
print('='*60)