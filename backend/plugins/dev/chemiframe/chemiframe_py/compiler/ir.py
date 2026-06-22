from typing import Any, Dict


def to_ir(route: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "route_id": route.get("route_id"),
        "family": route.get("family"),
        "steps": route.get("steps", []),
    }