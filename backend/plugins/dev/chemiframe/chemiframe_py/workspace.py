from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def artifacts_root() -> Path:
    path = repo_root() / "artifacts"
    path.mkdir(parents=True, exist_ok=True)
    return path