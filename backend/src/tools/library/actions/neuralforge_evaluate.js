import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function findNeuralforgeRoot() {
  const envRoot = process.env.NEURALFORGE_ROOT;
  if (envRoot && fs.existsSync(path.join(envRoot, 'neuralforge', 'agnt_bridge.py'))) {
    return envRoot;
  }
  const candidates = [
    path.resolve(process.cwd(), '../neuralforge'),
    path.resolve(process.cwd(), '../../neuralforge'),
    'C:\\Users\\jacks\\OneDrive\\Desktop\\NeuralForge',
    'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge',
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'neuralforge', 'agnt_bridge.py'))) {
      return dir;
    }
  }
  return null;
}

const NEURALFORGE_ROOT = findNeuralforgeRoot();

class NeuralForgeEvaluate {
  static schema = {
    title: 'Evaluate Neural Network',
    category: 'action',
    type: 'neuralforge_evaluate',
    icon: 'brain',
    description: 'Evaluate a neural network on test data',
    parameters: {
      description: { type: 'string', required: true, description: 'Model description' },
      num_classes: { type: 'string', default: '10', description: 'Number of classes' }
    }
  };

  async execute(params) {
    const description = params.description || 'Simple CNN for CIFAR-10';
    const numClasses = params.num_classes || 10;

    if (!NEURALFORGE_ROOT) {
      return { error: 'NeuralForge not found' };
    }

    const escaped = description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const pythonCode = `
import sys, json, os, torch
sys.path.insert(0, r"${NEURALFORGE_ROOT}")
from neuralforge.spec import NeuralForgeSpec
from neuralforge.core.forge import create_model
from neuralforge.evaluation.evaluator import ModelEvaluator
from torch.utils.data import TensorDataset, DataLoader

spec = NeuralForgeSpec.from_description("${escaped}")
model = create_model(spec)
nc = ${numClasses}
input_shape = spec.data_profile.input_shape if spec.data_profile else (3, 32, 32)
torch.manual_seed(42)
if len(input_shape) == 1:
    X = torch.randint(0, 1000, (100, input_shape[0]))
else:
    X = torch.randn(100, *input_shape)
y = torch.randint(0, nc, (100,))
evaluator = ModelEvaluator(model)
report = evaluator.evaluate(DataLoader(TensorDataset(X, y), batch_size=32), num_classes=nc)
output = {
    "status": "success",
    "metrics": report.metrics,
    "calibration_error": report.calibration_error,
    "recommendations": report.recommendations,
    "architecture": spec.architecture.family.value,
    "total_parameters": model.count_parameters()
}
print("NF_RESULT:" + json.dumps(output, default=str))
`;

    try {
      const result = spawnSync('python', ['-c', pythonCode], {
        cwd: NEURALFORGE_ROOT,
        env: { ...process.env, PYTHONPATH: NEURALFORGE_ROOT },
        timeout: 60000,
        encoding: 'utf8',
      });

      if (result.error) return { error: 'Python error: ' + result.error.message };

      const stdout = result.stdout || '';
      const match = stdout.match(/NF_RESULT:(.+)/);

      if (match) {
        try { return JSON.parse(match[1].trim()); }
        catch (e) { return { error: 'Parse error', raw: stdout.slice(0, 300) }; }
      }
      return { error: 'No result', stderr: (result.stderr || '').slice(0, 300) };
    } catch (e) {
      return { error: e.message };
    }
  }
}

export default new NeuralForgeEvaluate();
