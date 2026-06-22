from typing import Any, Dict
from .search import select_blueprint
from .route_graph import build


def plan(intent: Dict[str, Any]) -> Dict[str, Any]:
    blueprint = select_blueprint(intent)
    route = blueprint.plan(intent)
    route["blueprint"] = blueprint.name
    return route