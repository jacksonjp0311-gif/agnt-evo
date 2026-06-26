from pathlib import Path
from typing import Any, Dict
import json


def write_xdl_artifact(route: Dict[str, Any], xdl: str, artifacts_root: str = "artifacts/compiled_xdl") -> str:
    path = Path(artifacts_root)
    path.mkdir(parents=True, exist_ok=True)
    route_id = str(route.get("route_id", "route_unknown"))
    out = path / f"{route_id}.xdl"
    out.write_text(xdl, encoding="utf-8")
    return str(out)


def write_contract(route: Dict[str, Any], contract: Dict[str, Any], artifacts_root: str = "artifacts/contracts") -> str:
    path = Path(artifacts_root)
    path.mkdir(parents=True, exist_ok=True)
    route_id = str(route.get("route_id", "route_unknown"))
    out = path / f"{route_id}.contract.json"
    out.write_text(json.dumps(contract, indent=2), encoding="utf-8")
    return str(out)


def write_report(report: Dict[str, Any], artifacts_root: str = "artifacts/reports") -> str:
    path = Path(artifacts_root)
    path.mkdir(parents=True, exist_ok=True)
    run_id = str(report.get("run_id", "run_unknown"))
    out = path / f"{run_id}.report.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return str(out)