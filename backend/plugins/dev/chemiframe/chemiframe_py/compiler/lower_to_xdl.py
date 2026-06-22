from typing import Any, Dict


def lower_to_xdl(route: Dict[str, Any]) -> str:
    lines = [f'<procedure id="{route.get("route_id", "route")}" blueprint="{route.get("family", "unknown")}">']
    for step in route.get("steps", []):
        label = step.get("label", "step")
        op = step.get("op", "AM")
        xml_op = _map_op(op)
        lines.append(f'  <step op="{xml_op}" label="{label}"/>')
    lines.append("</procedure>")
    return "\n".join(lines)


def _map_op(op: str) -> str:
    mapping = {"AM": "add", "SM": "remove", "AE": "energize", "SE": "cool"}
    return mapping.get(op, "noop")