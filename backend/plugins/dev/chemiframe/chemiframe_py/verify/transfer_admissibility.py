from typing import Any, Dict


def check(contract: Dict[str, Any]) -> Dict[str, Any]:
    required = [
        "finite_route_ok",
        "detectability_ok",
        "dec_representation_ok",
        "artifact_visibility_ok",
        "trace_continuity_ok",
    ]
    ok = all(bool(contract.get(k, False)) for k in required)
    return {"transfer_admissible": ok}