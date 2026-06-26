import { runPython } from "./_bridge.mjs";

class NeuralForgePatternTool {
  constructor() {
    this.name = "neuralforge_pattern";
  }

  async execute(params) {
    const dataStr = params.data || params.values || params._raw || "";
    const predictSteps = params.predict_steps || params.steps || 5;
    const epochs = params.epochs || 50;

    if (!dataStr) {
      return { error: "Missing required parameter: data (comma-separated numbers or JSON array)" };
    }

    // Parse data: try JSON first, then comma-separated
    let data;
    try {
      data = JSON.parse(dataStr);
    } catch {
      data = dataStr.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    }

    if (!Array.isArray(data) || data.length < 5) {
      return { error: "Need at least 5 numeric data points. Got: " + (Array.isArray(data) ? data.length : "invalid") };
    }

    const dataJson = JSON.stringify(data);
    const escaped = dataJson.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const code = `
from neuralforge.pattern_engine import PatternEngine
import json
engine = PatternEngine()
result = engine.analyze(data=json.loads("${escaped}"), predict_steps=${predictSteps}, epochs=${epochs})
output = result
`;
    const result = runPython(code, 120000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgePatternTool();
