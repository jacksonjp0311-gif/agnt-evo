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

class NeuralForgeCreate {
  static schema = {
    title: 'Create Neural Network',
    category: 'action',
    type: 'neuralforge_create',
    icon: 'brain',
    description: 'Create a neural network from a natural language description',
    parameters: {
      description: {
        type: 'string',
        inputType: 'textarea',
        required: true,
        description: 'Natural language description of the model'
      }
    }
  };

  async execute(params) {
    const description = params.description || params._raw || '';
    if (!description) {
      return { error: 'Missing required parameter: description' };
    }

    if (!NEURALFORGE_ROOT) {
      return {
        error: 'NeuralForge not found. Set NEURALFORGE_ROOT env var.',
        searched: [
          process.env.NEURALFORGE_ROOT,
          path.resolve(process.cwd(), '../neuralforge'),
          'C:\\Users\\jacks\\OneDrive\\Desktop\\NeuralForge',
        ]
      };
    }

    const escaped = description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const pythonCode = `
import sys, json, os
sys.path.insert(0, r"${NEURALFORGE_ROOT}")
from neuralforge.spec import NeuralForgeSpec
from neuralforge.core.forge import create_model
spec = NeuralForgeSpec.from_description("${escaped}")
model = create_model(spec)
output = {
    "status": "success",
    "model_name": spec.name,
    "parameters": model.count_parameters(),
    "architecture": spec.architecture.family.value,
    "input_shape": str(spec.data_profile.input_shape) if spec.data_profile else None,
    "num_classes": spec.data_profile.num_classes if spec.data_profile and spec.data_profile.num_classes else None,
    "config_hash": spec.config_hash()
}
print("NF_RESULT:" + json.dumps(output, default=str))
`;

    try {
      const result = spawnSync('python', ['-c', pythonCode], {
        cwd: NEURALFORGE_ROOT,
        env: { ...process.env, PYTHONPATH: NEURALFORGE_ROOT },
        timeout: 30000,
        encoding: 'utf8',
      });

      if (result.error) {
        return { error: 'Python spawn error: ' + result.error.message };
      }

      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const match = stdout.match(/NF_RESULT:(.+)/);

      if (match) {
        try {
          return JSON.parse(match[1].trim());
        } catch (e) {
          return { error: 'Failed to parse Python output', raw: stdout.slice(0, 300) };
        }
      }

      return { error: 'No result from Python', stdout: stdout.slice(0, 300), stderr: stderr.slice(0, 300) };
    } catch (e) {
      return { error: e.message };
    }
  }
}

export default new NeuralForgeCreate();
