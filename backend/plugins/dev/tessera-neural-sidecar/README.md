# Tessera Neural Trust Layer — AGNT Plugin

## What It Does

Tessera is a **neural trust layer** that watches an agent's operational trajectory, compresses it into sparse neural state, and emits **trusted/abstain** decisions. It runs as a supervised read-only sidecar — it never mutates host memory, calls tools, or changes prompts.

## AGNT Integration

This plugin exposes 5 tools to AGNT agents:

| Tool | Purpose |
|---|---|
| `tessera-analyze` | Analyze agent session trajectory for drift and anomalies |
| `tessera-trust` | Get trust decision (trusted/abstain) for current session |
| `tessera-memory` | Propose memory candidates from session events |
| `tessera-health` | Get plugin health and runtime status |
| `tessera-status` | Get full status dashboard with metrics and evidence |

## Quick Start

### 1. Start the Bridge Server

```bash
cd C:\Users\jacks\OneDrive\Desktop\Tessera
python -m tessera.agnt_bridge --port 8765
```

### 2. Install the Plugin

```bash
# Option A: CLI install
cd agnt-plugin
# Build .agnt package:
tar -czf tessera.agnt manifest.json package.json index.js README.md
# Then: AGNT dashboard → Plugins → Install from File → upload tessera.agnt

# Option B: Direct API install (requires AGNT running)
curl -X POST http://localhost:3333/api/plugins/install-file \
  -H "Content-Type: application/json" \
  -d '{"name":"tessera-neural-sidecar","fileData":"<base64-tar.gz>","fileName":"tessera.agnt"}'
```

### 3. Call Tools

```bash
# Analyze a session
curl -X POST http://localhost:8765/tools/tessera-analyze \
  -H "Content-Type: application/json" \
  -d '{"events":[{"phase":"CHECK","state":"OK","elapsed_ms":100}]}'

# Get trust decision
curl -X POST http://localhost:8765/tools/tessera-trust \
  -H "Content-Type: application/json" \
  -d '{"trust_route":"trusted","anomaly_score":0.1}'

# Get full status
curl -X POST http://localhost:8765/tools/tessera-status \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Architecture

```
AGNT Agent Session
    ↓
AGNT Event Stream (agent events from chat, tools, execution)
    ↓
tessera-analyze → trajectory analysis + anomaly detection
tessera-trust → trusted/abstain decision
tessera-memory → memory proposals (host-gated)
    ↓
PluginSupervisor (subprocess isolation, circuit breaker)
    ↓
TESSERANet (GRU gating, multi-scale prediction)
    ↓
Neural Uncertainty Router → trust decision
    ↓
Atomic Capsule Store → durable state (SHA-256)
```

## Verified Metrics

| Metric | Value |
|---|---|
| NAB AUC | 0.949 (T1 Supported) |
| UCR AUC | 0.961 (T1 Confirmed) |
| Production p95 | 95.19 ms |
| Route Parity | 20/20 |
| Soak Failures | 0/100 |
| Effective Rank | 2/84 |
| Restart Speedup | 49.5x |

## Source Code

Full source: https://github.com/jacksonjp0311-gif/TESSERA

## Version

v0.4.4 — EVO-049 — 170+ tests passing
