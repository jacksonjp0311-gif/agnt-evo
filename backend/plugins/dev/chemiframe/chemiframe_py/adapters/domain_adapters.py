from typing import Any, Dict


def evaluate_transfer(contract: Dict[str, Any]) -> Dict[str, Any]:
    required = [
        "finite_route_ok",
        "detectability_ok",
        "dec_representation_ok",
        "artifact_visibility_ok",
        "trace_continuity_ok",
    ]
    return {"transfer_admissible": all(bool(contract.get(k, False)) for k in required)}