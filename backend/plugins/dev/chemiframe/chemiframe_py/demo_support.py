from typing import Any, Dict
from chemiframe import planner, compiler
from chemiframe_py.verify.contracts import run_preflight
from chemiframe.runtime.orchestrator import execute
from chemiframe.runtime.trace import store as store_trace
from chemiframe.adapters.simulator import simulator


def run_pipeline(intent: Dict[str, Any], simulate: bool = False) -> Dict[str, Any]:
    route = planner.plan(intent)
    contracts = run_preflight(route)
    if not contracts["ok"]:
        raise ValueError("Route failed verification")

    xdl = compiler.lower_to_xdl(route)
    artifact_path = compiler.write_xdl_artifact(route, xdl)
    contract_path = compiler.write_contract(route, contracts)

    if simulate:
        run = simulator.execute(xdl)
        run_id = run["run_id"]
    else:
        run = execute(xdl)
        run_id = run["id"]

    trace_path = store_trace(run)

    report = {
        "intent": intent,
        "route": route,
        "contracts": contracts,
        "artifact_path": artifact_path,
        "contract_path": contract_path,
        "trace_path": trace_path,
        "run_id": run_id,
        "simulated": bool(run.get("simulated", False)),
        "status": run.get("status", "unknown"),
    }
    report_path = compiler.write_report(report)
    report["report_path"] = report_path
    return report