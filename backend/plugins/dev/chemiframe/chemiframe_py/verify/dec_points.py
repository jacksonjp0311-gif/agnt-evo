from typing import Any, Dict, List


def check(route: Dict[str, Any]) -> Dict[str, Any]:
    points: List[str] = []
    for step in route.get("steps", []):
        label = step.get("label", "")
        if "monitor" in label or "checkpoint" in label or "verify" in label:
            points.append(label)
    return {"dec_points_defined": len(points) > 0, "dec_points": points}