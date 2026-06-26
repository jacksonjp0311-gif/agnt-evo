import { runPython } from "./_bridge.mjs";

class NeuralForgeOptimizeParamsTool {
  constructor() { this.name = "neuralforge_optimize_params"; }

  async execute(params) {
    const tool = params.tool_name || params.tool || "unknown";
    const load = parseFloat(params.context_load || params.load || 0.5);
    const dataSize = parseFloat(params.data_size || params.dataSize || 1000);

    const code = `
import sys, json, torch, numpy as np
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")

from build_neural_tools import ParameterOptimizerNet
model = ParameterOptimizerNet()
try:
    model.load_state_dict(torch.load(r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge\\models\\param_optimizer.pt", weights_only=True))
except:
    pass
model.eval()

load = ${load}
data_size = ${dataSize}
hour = __import__('datetime').datetime.now().hour / 24.0
x = torch.tensor([[load, data_size/10000, hour, load*0.8, data_size/5000, load*0.5]], dtype=torch.float32)

with torch.no_grad():
    params_pred, quality = model(x)
    p = params_pred[0].tolist()
    q = quality[0].item()

timeout = int(max(1000, min(30000, p[0] * 15000 + 5000)))
retries = int(max(1, min(10, p[1] * 5 + 1)))
backoff = round(max(0.1, min(2.0, p[2] * 1.0 + 0.5)), 2)

output = {
    "recommended_timeout_ms": timeout,
    "recommended_retries": retries,
    "backoff_factor": backoff,
    "predicted_quality": round(float(q), 3),
    "tool": "${tool}"
}
print("NF_PARAMS_RESULT:" + json.dumps(output))
`;
    const result = runPython(code, 30000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeOptimizeParamsTool();
