import { runPython } from "./_bridge.mjs";

class NeuralForgePredictFailureTool {
  constructor() { this.name = "neuralforge_predict_failure"; }

  async execute(params) {
    const tool = params.tool_name || params.tool || "unknown";
    const load = parseFloat(params.system_load || params.load || 0.5);
    const recentErrors = parseInt(params.recent_errors || params.errors || 0);
    const hour = parseFloat(params.time_of_day || new Date().getHours());

    const code = `
import sys, json, torch, numpy as np
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")

from build_neural_tools import FailurePredictorNet
model = FailurePredictorNet()
try:
    model.load_state_dict(torch.load(r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge\\models\\failure_predictor.pt", weights_only=True))
except:
    pass
model.eval()

load = ${load}
errors = ${recentErrors}
hour = ${hour}
x = torch.tensor([[load, errors/10, hour/24, load*0.7, errors/5, hour/12, load*0.3, errors/20, hour/6, load*0.5]], dtype=torch.float32)

with torch.no_grad():
    prob = model(x).item()

risk = "high" if prob > 0.7 else "medium" if prob > 0.3 else "low"
recs = []
if prob > 0.7:
    recs.append("High failure risk — add retry logic and increase timeout")
    recs.append("Consider running during off-peak hours")
if load > 0.7:
    recs.append("System load is high — reduce batch size or delay execution")
if errors > 3:
    recs.append(f"{errors} recent errors — check service health before retrying")

output = {
    "failure_probability": round(float(prob), 3),
    "risk_level": risk,
    "recommendations": recs,
    "tool": "${tool}"
}
print("NF_PREDICT_RESULT:" + json.dumps(output))
`;
    const result = runPython(code, 30000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgePredictFailureTool();
