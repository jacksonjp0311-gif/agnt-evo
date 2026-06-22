from typing import Any, Dict


def idle_state() -> Dict[str, Any]:
    return {
        "status": "idle",
        "run_id": None,
        "events": [],
    }