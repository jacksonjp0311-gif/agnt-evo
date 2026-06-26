from typing import Any, Dict


def bind(route: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "route_id": route.get("route_id"),
        "hardware_graph": ["reactor_1", "monitor_1", "workup_1"],
        "bound": True,
    }