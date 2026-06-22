from typing import Any, Dict


def build(route: Dict[str, Any]) -> Dict[str, Any]:
    steps = route.get("steps", [])
    nodes = []
    edges = []
    for idx, step in enumerate(steps):
        node_id = f"n{idx}"
        nodes.append({"id": node_id, "label": step.get("label", f"step_{idx}")})
        if idx > 0:
            edges.append({"source": f"n{idx-1}", "target": node_id})
    return {"nodes": nodes, "edges": edges}