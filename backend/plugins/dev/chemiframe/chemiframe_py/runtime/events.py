from typing import Any, Dict


def make_event(kind: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"kind": kind, "payload": payload}