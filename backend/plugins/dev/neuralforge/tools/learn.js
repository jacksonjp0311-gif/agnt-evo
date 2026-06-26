import { runPython } from "./_bridge.mjs";

class NeuralForgeLearnTool {
  constructor() {
    this.name = "neuralforge_learn";
  }

  async execute(params) {
    const XStr = params.X || params.features || params.input || "";
    const yStr = params.y || params.targets || params.labels || "";
    const epochs = params.epochs || 50;

    if (!XStr || !yStr) {
      return { error: "Missing required parameters: X (features) and y (targets). Both must be JSON arrays." };
    }

    let X, y;
    try {
      X = JSON.parse(XStr);
      y = JSON.parse(yStr);
    } catch (e) {
      return { error: "Invalid JSON: " + e.message };
    }

    if (!Array.isArray(X) || !Array.isArray(y)) {
      return { error: "X and y must be arrays. Got: X=" + typeof X + ", y=" + typeof y };
    }

    const XJson = JSON.stringify(X).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const yJson = JSON.stringify(y).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const code = `
from neuralforge.learner import DataLearner
import json, torch
learner = DataLearner(device=torch.device("cpu"))
result = learner.learn(X=json.loads("${XJson}"), y=json.loads("${yJson}"), epochs=${epochs})
output = result
`;
    const result = runPython(code, 120000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeLearnTool();
