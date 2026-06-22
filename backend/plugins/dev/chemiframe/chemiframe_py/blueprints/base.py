from typing import Any, Dict


class ChemicalBlueprint:
    name = "base_blueprint"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        raise NotImplementedError

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError