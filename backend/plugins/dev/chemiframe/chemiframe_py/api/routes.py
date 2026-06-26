from typing import Any, Dict
from chemiframe import planner, compiler
from chemiframe_py.verify.contracts import run_preflight
from chemiframe.runtime import orchestrator, trace
from chemiframe.adapters.simulator import simulator


def compile_intent(intent: Dict[str, Any]) -> Dict[str, Any]:
    route = planner.plan(intent)
    contracts = run_preflight(route)
    artifact = compiler.lower_to_xdl(route) if contracts["ok"] else None
    return {"route": route, "contracts": contracts, "artifact": artifact}


def execute_route(route: Dict[str, Any]) -> Dict[str, Any]:
    xdl = compiler.lower_to_xdl(route)
    run = orchestrator.execute(xdl)
    trace.store(run)
    return {"run_id": run["id"], "status": run["status"]}


def simulate_route(route: Dict[str, Any]) -> Dict[str, Any]:
    xdl = compiler.lower_to_xdl(route)
    run = simulator.execute(xdl)
    trace.store(run)
    return {"run_id": run["run_id"], "status": run["status"], "simulated": True}