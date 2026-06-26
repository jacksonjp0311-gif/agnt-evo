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

class NeuralForgeTrain {
  static schema = {
    title: 'Train Neural Network',
    category: 'action',
    type: 'neuralforge_train',
    icon: 'brain',
    description: 'Train a neural network from a natural language description',
    parameters: {
      description: { type: 'string', required: true, description: 'Model description' },
      epochs: { type: 'string', default: '5', description: 'Training epochs' },
      batch_size: { type: 'string', default: '32', description: 'Batch size' },
      learning_rate: { type: 'string', default: '0.001', description: 'Learning rate' },
      seed: { type: 'string', default: '42', description: 'Random seed' }
    }
  };

  async execute(params) {
    const description = params.description || 'Simple CNN for CIFAR-10';
    const epochs = params.epochs || 5;
    const batchSize = params.batch_size || 32;
    const lr = params.learning_rate || 0.001;
    const seed = params.seed || 42;

    if (!NEURALFORGE_ROOT) {
      return { error: 'NeuralForge not found' };
    }

    const escaped = description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const pythonCode = `
import sys, json, os, torch
sys.path.insert(0, r"${NEURALFORGE_ROOT}")
from neuralforge.spec import NeuralForgeSpec, TrainingConfig
from neuralforge.core.forge import create_model
from neuralforge.training.engine import TrainingEngine
from torch.utils.data import TensorDataset, DataLoader

spec = NeuralForgeSpec.from_description("${escaped}")
spec.training = TrainingConfig(epochs=${epochs}, batch_size=${batchSize}, learning_rate=${lr}, precision="mixed", seed=${seed})
model = create_model(spec)
nc = spec.data_profile.num_classes if spec.data_profile and spec.data_profile.num_classes else 10
input_shape = spec.data_profile.input_shape if spec.data_profile else (3, 32, 32)
torch.manual_seed(${seed})
if len(input_shape) == 1:
    X = torch.randint(0, 1000, (200, input_shape[0]))
else:
    X = torch.randn(200, *input_shape)
y = torch.randint(0, nc, (200,))
X_tr, y_tr = X[40:], y[40:]
X_va, y_va = X[:40], y[:40]
engine = TrainingEngine(model, spec, spec.training)
result = engine.train(DataLoader(TensorDataset(X_tr, y_tr), batch_size=${batchSize}, shuffle=True), DataLoader(TensorDataset(X_va, y_va), batch_size=${batchSize}))
output = {
    "status": "success",
    "epochs_completed": result.epochs_completed,
    "final_loss": result.final_loss,
    "best_metric": result.best_metric,
    "best_epoch": result.best_epoch,
    "training_time_seconds": round(result.training_time_seconds, 2),
    "training_status": result.status,
    "architecture": spec.architecture.family.value,
    "total_parameters": model.count_parameters()
}
print("NF_RESULT:" + json.dumps(output, default=str))
`;

    try {
      const result = spawnSync('python', ['-c', pythonCode], {
        cwd: NEURALFORGE_ROOT,
        env: { ...process.env, PYTHONPATH: NEURALFORGE_ROOT },
        timeout: 120000,
        encoding: 'utf8',
      });

      if (result.error) return { error: 'Python error: ' + result.error.message };

      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const match = stdout.match(/NF_RESULT:(.+)/);

      if (match) {
        try { return JSON.parse(match[1].trim()); }
        catch (e) { return { error: 'Parse error', raw: stdout.slice(0, 300) }; }
      }
      return { error: 'No result', stderr: stderr.slice(0, 300) };
    } catch (e) {
      return { error: e.message };
    }
  }
}

export default new NeuralForgeTrain();
