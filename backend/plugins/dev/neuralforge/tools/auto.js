import { runPython } from "./_bridge.mjs";

class NeuralForgeAutoTool {
  constructor() {
    this.name = "neuralforge_auto";
  }

  async execute(params) {
    const code = `
import sys, json, os, time
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")
from neuralforge.evo_engine import EvolutionEngine
from neuralforge.realtime_evo import RealtimeEvolutionEngine
from neuralforge.smart_engine import SmartEngine
import numpy as np

# Load cached execution data
with open(r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge\\exec_data.json", "r") as f:
    executions = json.load(f)

# Filter out test workflows (LSS Audit runs 2942 times with 0% success)
real_execs = [e for e in executions if "LSS Audit" not in e.get("workflow_name", "") and "Smoke Test" not in e.get("workflow_name", "")]

# If too few real executions, use all but weight differently
if len(real_execs) < 10:
    execs = executions
    filtered = False
else:
    execs = real_execs
    filtered = True

# Run evolution
evo = EvolutionEngine()
result = evo.evolve(execs, focus="all")

obs = result.get("observation", {})
evo_stage = result.get("evolution", {})

# Smart decisions
smart = SmartEngine()
recent = [{"success": e.get("success", True), "duration_ms": e.get("duration_ms", 0)} for e in execs[-20:]]
retry = smart.decide("retry", history=recent)

output = {
    "status": "success",
    "filtered_test_workflows": filtered,
    "total_executions": len(execs),
    "health_score": obs.get("health_score"),
    "success_rate": obs.get("overall_success_rate"),
    "workflows_analyzed": obs.get("workflows_analyzed"),
    "total_failures": obs.get("total_failures"),
    "recommendations": evo_stage.get("recommendations", []),
    "high_risk_workflows": result.get("predictions", {}).get("high_risk", []),
    "retry_decision": retry.get("decision"),
    "retry_confidence": retry.get("confidence"),
    "evolution_stage": evo_stage.get("evolution_stage"),
    "workflow_stats": obs.get("workflow_stats", {}),
}
print("NF_AUTO_RESULT:" + json.dumps(output, default=str))
`;
    const result = runPython(code, 180000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeAutoTool();
