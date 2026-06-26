from typing import Any, Dict


def check(route: Dict[str, Any]) -> Dict[str, Any]:
    ok = len(route.get("steps", [])) > 0
    return {"route_admissible": ok}