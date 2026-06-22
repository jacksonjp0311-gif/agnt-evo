from typing import Any, Dict
from chemiframe_py.verify import detectability, assembly_bound, dec_points, route_admissibility


def run_preflight(route: Dict[str, Any]) -> Dict[str, Any]:
    parts = {}
    for module in [detectability, assembly_bound, dec_points, route_admissibility]:
        parts.update(module.check(route))
    parts["trace_schema_ok"] = True
    parts["ok"] = all(
        bool(parts.get(k, False))
        for k in ["detectability_ok", "assembly_bound_ok", "dec_points_defined", "route_admissible"]
    )
    return parts