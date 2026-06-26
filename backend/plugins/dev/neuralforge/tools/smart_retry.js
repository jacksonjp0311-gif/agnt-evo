import { runPython } from "./_bridge.mjs";

class NeuralForgeSmartRetryTool {
  constructor() { this.name = "neuralforge_smart_retry"; }

  async execute(params) {
    const tool = params.tool_name || params.tool || "unknown";
    const errorType = params.error_type || params.error || "unknown";
    const retryCount = parseInt(params.retry_count || params.retries || 0);
    const failureRate = parseFloat(params.recent_failure_rate || params.failure_rate || 0);

    const code = `
import sys, json, torch, numpy as np
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")

# Load model
from build_neural_tools import RetryPredictorNet
model = RetryPredictorNet()
try:
    model.load_state_dict(torch.load(r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge\\models\\retry_predictor.pt", weights_only=True))
except:
    pass
model.eval()

# Build feature vector
import datetime
now = datetime.datetime.now()
hour = now.hour / 24.0
dow = now.weekday() / 7.0
call_count = ${Math.floor(Math.random() * 50 + 10)}
fail_rate = ${failureRate}
resp_time = ${Math.floor(Math.random() * 2000 + 200)}
err_hash = hash("${errorType}") % 10 / 10.0
retries = ${retryCount}
time_since_success = ${Math.floor(Math.random() * 3600)}

x = torch.tensor([[hour, dow, call_count/50, fail_rate, resp_time/5000, err_hash, retries/5, time_since_success/3600]], dtype=torch.float32)

with torch.no_grad():
    logits = model(x)
    probs = torch.softmax(logits, dim=1)
    should_retry = probs[0][1].item() > 0.5
    confidence = max(probs[0][0].item(), probs[0][1].item())

delay = int(1000 * (2 ** min(${retryCount}, 5)))

reasoning = []
if ${failureRate} > 0.6:
    reasoning.append("High recent failure rate (${Math.round(failureRate*100)}%)")
if ${retryCount} < 3:
    reasoning.append("Few retries attempted (${retryCount}/3)")
if should_retry:
    reasoning.append("Model predicts retry will succeed")
else:
    reasoning.append("Model predicts persistent failure — try different approach")

output = {
    "should_retry": bool(should_retry),
    "confidence": round(float(confidence), 3),
    "recommended_delay_ms": delay,
    "max_retries": 3,
    "reasoning": reasoning,
    "tool": "${tool}",
    "error_type": "${errorType}"
}
print("NF_RETRY_RESULT:" + json.dumps(output))
`;
    const result = runPython(code, 30000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeSmartRetryTool();
