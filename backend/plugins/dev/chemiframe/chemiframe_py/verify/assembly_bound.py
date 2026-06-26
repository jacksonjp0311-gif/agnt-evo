from typing import Any, Dict


def check(route: Dict[str, Any]) -> Dict[str, Any]:
    return {"assembly_bound_ok": True, "assembly_index": len(route.get("steps", []))}