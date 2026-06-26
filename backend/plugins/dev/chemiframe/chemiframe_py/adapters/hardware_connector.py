from typing import Any, Dict


def bind(compiled_artifact: Any) -> Dict[str, Any]:
    return {"bound": True, "target": "mock_hardware", "artifact": compiled_artifact}