import { runPython } from "./_bridge.mjs";

class NeuralForgeSmartTool {
  constructor() {
    this.name = "neuralforge_smart";
  }

  async execute(params) {
    const context = params.context || params.type || params.action || "auto";
    const dataStr = params.data || params.values || "[]";
    const optionsStr = params.options || params.choices || "[]";
    const historyStr = params.history || params.past || "[]";

    let data = [], options = [], history = [];
    try { data = JSON.parse(dataStr); } catch(e) { /* ignore */ }
    try { options = JSON.parse(optionsStr); } catch(e) { /* ignore */ }
    try { history = JSON.parse(historyStr); } catch(e) { /* ignore */ }

    const dataJson = JSON.stringify(data).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const optionsJson = JSON.stringify(options).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const historyJson = JSON.stringify(history).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const code = `
import sys, json
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")
from neuralforge.smart_engine import SmartEngine
engine = SmartEngine()
result = engine.decide(
    context="${context}",
    data=json.loads("${dataJson}"),
    options=json.loads("${optionsJson}"),
    history=json.loads("${historyJson}")
)
output = result
`;
    const result = runPython(code, 120000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeSmartTool();
