import { runPython } from "./_bridge.mjs";

class NeuralForgeAnalyzeTool {
  constructor() {
    this.name = "neuralforge_analyze";
  }

  async execute(params) {
    const executionsStr = params.executions || params.data || params.history || "";
    const predictNext = params.predict_next !== "false" && params.predict_next !== "0";

    if (!executionsStr) {
      return {
        error: "Missing required parameter: executions (JSON array of execution records)",
        example: {
          executions: [
            { duration_ms: 1200, success: true, step_count: 5 },
            { duration_ms: 1500, success: true, step_count: 5 },
            { duration_ms: 3000, success: false, step_count: 3, error_type: "timeout" },
          ],
        },
      };
    }

    let executions;
    try {
      executions = JSON.parse(executionsStr);
    } catch (e) {
      return { error: "Invalid JSON: " + e.message };
    }

    if (!Array.isArray(executions) || executions.length < 3) {
      return { error: "Need at least 3 execution records. Got: " + (Array.isArray(executions) ? executions.length : "invalid") };
    }

    const execJson = JSON.stringify(executions).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const code = `
import sys, json
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")
from neuralforge.analyzer import WorkflowAnalyzer
analyzer = WorkflowAnalyzer()
result = analyzer.analyze(executions=json.loads("${exec_json}"), predict_next=${predictNext ? "True" : "False"})
output = result
`;
    const result = runPython(code, 120000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeAnalyzeTool();
