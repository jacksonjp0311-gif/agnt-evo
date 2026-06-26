import { runPython } from "./_bridge.mjs";

class NeuralForgeEvolveTool {
  constructor() {
    this.name = "neuralforge_evolve";
  }

  async execute(params) {
    const executionsStr = params.executions || params.data || params.history || "";
    const focus = params.focus || "all";

    if (!executionsStr) {
      return {
        error: "Missing required parameter: executions (JSON array of workflow execution records)",
        example: {
          executions: [
            { workflow_id: "wf-1", workflow_name: "Email Pipeline", duration_ms: 1200, success: true, step_count: 5, timestamp: "2026-06-22T10:00:00Z" },
            { workflow_id: "wf-1", workflow_name: "Email Pipeline", duration_ms: 1500, success: true, step_count: 5, timestamp: "2026-06-22T11:00:00Z" },
            { workflow_id: "wf-2", workflow_name: "Data Sync", duration_ms: 3000, success: false, step_count: 3, error_type: "timeout", timestamp: "2026-06-22T10:30:00Z" },
          ],
          focus: "all",
        },
      };
    }

    let executions;
    try { executions = JSON.parse(executionsStr); } catch(e) { return { error: "Invalid JSON: " + e.message }; }
    if (!Array.isArray(executions) || executions.length < 3) {
      return { error: "Need at least 3 execution records, got: " + (Array.isArray(executions) ? executions.length : "invalid") };
    }

    const execJson = JSON.stringify(executions).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const code = `
import sys, json
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")
from neuralforge.evo_engine import EvolutionEngine
engine = EvolutionEngine()
result = engine.evolve(executions=json.loads("${exec_json}"), focus="${focus}")
output = result
`;
    const result = runPython(code, 180000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeEvolveTool();
