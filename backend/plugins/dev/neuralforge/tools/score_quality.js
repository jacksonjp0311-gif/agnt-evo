import { runPython } from "./_bridge.mjs";

class NeuralForgeScoreQualityTool {
  constructor() { this.name = "neuralforge_score_quality"; }

  async execute(params) {
    const length = parseInt(params.response_length || params.length || 100);
    const hasStructure = params.has_structure !== "false" && params.has_structure !== false;
    const responseTime = parseFloat(params.response_time_ms || params.time || 1000);
    const hasErrors = params.has_errors === "true" || params.has_errors === true;

    const code = `
import sys, json, torch, numpy as np
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")

from build_neural_tools import QualityScorerNet
model = QualityScorerNet()
try:
    model.load_state_dict(torch.load(r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge\\models\\quality_scorer.pt", weights_only=True))
except:
    pass
model.eval()

length = ${length}
structured = 1.0 if ${hasStructure} else 0.0
time_ms = ${responseTime}
errors = 1.0 if ${hasErrors} else 0.0
x = torch.tensor([[length/1000, structured, time_ms/5000, errors, length/500, structured*0.8, time_ms/2000, errors*0.5, length/200, structured*0.6, time_ms/1000, errors*0.3]], dtype=torch.float32)

with torch.no_grad():
    score = model(x).item()

label = "excellent" if score > 0.8 else "good" if score > 0.6 else "fair" if score > 0.4 else "poor"
suggestions = []
if score < 0.6:
    suggestions.append("Response quality is below threshold — consider re-generating")
if length < 100:
    suggestions.append("Response is very short — may be incomplete")
if errors:
    suggestions.append("Response contains errors — validate before using")
if time_ms > 5000:
    suggestions.append("Response was slow — consider caching or optimization")

output = {
    "quality_score": round(float(score), 3),
    "quality_label": label,
    "improvement_suggestions": suggestions
}
print("NF_QUALITY_RESULT:" + json.dumps(output))
`;
    const result = runPython(code, 30000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeScoreQualityTool();
