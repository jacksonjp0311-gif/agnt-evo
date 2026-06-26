<div align="center">

# Tessera

### Neural Trust Layer for Agent Systems

[![Operator Surface](https://img.shields.io/badge/Operator%20Surface-v0.3.9-blue)](.)
[![RCC-N](https://img.shields.io/badge/RCC--N-Full-brightgreen)](.)
[![Tests](https://img.shields.io/badge/Tests-162%2F162%20passing-brightgreen)](.)
[![Version](https://img.shields.io/badge/Version-v0.4.1-cyan)](.)
[![Dashboard](https://img.shields.io/badge/📊-Dashboard-live%20preview-brightgreen)](./dashboard/index.html)

</div>

---

## 📊 [Live Dashboard →](./dashboard/index.html)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  TESSERA — Neural Trust Layer — EVO-045                             │
│  162/162 tests passing │ v0.4.1 │ 60 lessons │ 45 evidence files   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  NAB AUC 0.949        UCR AUC 0.961       Production p95  95ms     │
│  ├─ T1 Supported ✓    ├─ T1 Confirmed ✓   ├─ Under 250ms ✓         │
│  ├─ Recall 0.993      ├─ Recall 1.000     ├─ 0/100 soak failures   │
│  └─ Replay 0.668      └─ Replay 0.612     └─ 20/20 parity ✓       │
│                                                                     │
│  Route Parity 20/20   Effective Rank 2/84  Restart 49.5x           │
│  ├─ 18 trusted        ├─ 3 phantoms gone   ├─ 1.13ms cold start    │
│  └─ 2 abstained       └─ 90% coverage      └─ SHA-256 integrity ✓  │
│                                                                     │
│  Open Items:  Third Family ████░░ 50%  │  Live Agent ██████░ 60%   │
│              Launch Gates ████░░ 40%   │  Neural Prediction ✓     │
│                                              By Design              │
│                                                                     │
│  [View Full Interactive Dashboard →](./dashboard/index.html)        │
└─────────────────────────────────────────────────────────────────────┘
```

<div align="center">

### [🚀 Open Full Dashboard](./dashboard/index.html) &nbsp;│&nbsp; [📖 Docs](./docs/) &nbsp;│&nbsp; [📊 Benchmarks](./docs/benchmarks/)

</div>

---

## What Tessera Is

Tessera is a **local-first neural trust layer for agent systems**. It watches an agent's privacy-safe operational trajectory, compresses it into sparse neural state, and answers a deliberately narrow question: **should the host trust this session — or abstain?**

It runs as a **supervised local sidecar**. Stable experts retain forecast ownership; the sparse neural field measures latent drift and earns only selective trust-routing authority. An abstention cannot write memory, call tools, mutate prompts, replace models, or overrule the host.

## Current Health Snapshot

| Surface | Current result |
|---|---:|
| Repository | `Tessera` |
| Package / CLI | `tessera` v0.4.1 |
| Operator Surface | v0.3.9 |
| Tests | **162/162 passing** |
| Lessons | **60 promoted** (F001–F060) |
| Evidence Packages | **45** (EVO-001 through EVO-045) |
| Geometry | 44 nodes, 81 edges |
| Command Registry | `docs/loop/TESSERA_COMMAND_REGISTRY.md` |
| Claim Ceiling | `two_dataset_families_T1_supported_general_transfer_open` |
| Integration Closed | `true` |
| Authority OK | `true` |

## Verified Metrics

```text
REAL TELEMETRY
  NAB (machine temperature)     AUC 0.949 │ Recall 0.993 │ FMR 0.004 │ T1 Supported ✓
  UCR (air temp / ECG)         AUC 0.961 │ Recall 1.000 │ FMR 0.000 │ T1 Confirmed ✓
  NASA SMAP Telemanom          AUC 0.569 │ High contamination │ Rejected

PRODUCTION CANDIDATE (EVO-034)
  Semantic route parity        20/20 untouched sessions
  Trusted / Abstain            18 / 2
  Warm p95 latency             95.19 ms (budget: 250 ms) ✓
  Soak p99 latency             126.79 ms ✓
  Soak failures                0/100 ✓

NEURAL UNCERTAINTY ROUTER (EVO-032)
  Final coverage               90%
  Risk reduction vs full       6.53%
  Risk reduction vs simple     10.37%
  Forecast mutated             No ✓

EFFECTIVE RANK (EVO-038)
  Ambient dimension            84
  Legacy declared              5
  Effective rank               2
  Phantom dimensions removed   3

TRAJECTORY BENCHMARK
  Tessera     Failure recall 1.0 │ Decision accuracy 1.0 │ Latency 297ms
  Summary     Failure recall 0.667 │ Decision accuracy 0.833 │ Latency 0.77ms
  Recency     Failure recall 1.0 │ Decision accuracy 1.0 │ Latency 0.08ms

RESTART STATE (EVO-042)
  Restart continuation         1.13 ms
  Full replay                  56.12 ms
  Speedup                      49.5x
  Tamper rejection             ✓
```

## Architecture

```
Agent Event Stream
    ↓
[10 Typed Adapters] → Unified 28-dim Feature Space
    ↓
Host Adapters (Agent CLI Mirror + Hermes)
    ↓
Effective Rank Selection (2 of 84 dimensions)
    ↓
Manifold Monitor (drift → 4 fault injections rejected)
    ↓
TesseraPlugin (stateful memory, multi-scale anomaly, uncertainty routing)
    ↓
PluginSupervisor (subprocess isolation, circuit breaker, hard timeout)
    ↓
TESSERANet (GRU gating, configurable depth/width, multi-scale prediction)
    ↓
Neural Uncertainty Router (latent drift → abstain/trusted)
    ↓
Stable Expert Bank (persistence, EWMA, ridge AR) → Forecast
    ↓
Host receives: trusted/abstain + memory proposals (read-only)
    ↓
Incident Governor (abstain latch, memory suppression, clean recovery)
    ↓
State Capsules (SHA-256 integrity, portable across worker restart)
    ↓
Atomic Host-Owned Capsule Store (append-only, FIFO eviction, tamper-proof)
```

## What It Can Do

| Capability | Status |
|---|---:|
| Neural trust routing | ✅ Emits explicit trusted or abstain decisions from calibrated latent drift |
| Session-semantic adapters | ✅ Converts native AgentEvent or JSON host sessions into the Tessera trajectory format |
| Replay-tested memory | ✅ Candidate memories validated against held-out replay before promotion |
| Multi-scale anomaly | ✅ Instant, short, and medium horizon awareness channels |
| Wound tracking | ✅ Records and classifies failure modes across inference cycles |
| Uncertainty routing | ✅ Latent drift — not prediction — routes abstention (EVO-032) |
| Effective rank calibration | ✅ Audits declared dimensions, removes float32 noise (EVO-038) |
| Prefix/state continuation | ✅ Warm-start from pinned prefix (EVO-041, 48.3x speedup) |
| Integrity-bound restart | ✅ SHA-256 capsules survive worker restart (EVO-042, 49.5x speedup) |
| Atomic capsule store | ✅ Host-owned durable capsule store with FIFO eviction (EVO-043) |
| Local utility benchmark | ✅ Captures Agent CLI Mirror sessions, measures coverage & drift (EVO-043) |
| Independent host trials | ✅ Cross-host parity measurement framework (EVO-044) |
| Shadow repair | ✅ 5-arm ablation framework with eligibility + utility ranking |
| Host integrations | ✅ Agent CLI Mirror + Hermes |
| Privacy-safe capture | ✅ No commands/prompts/payloads in local ledger |
| Production candidate | ✅ 95ms p95, 0/100 soak failures, 20/20 parity |

## What It Has Rejected (Openness About Failures)

| Rejection | Operation | Reason |
|---|---|---|
| Universal shape window | EVO-007 | UCR confirmation AUC 0.437 |
| NASA SMAP cross-family | EVO-010 | AUC 0.569, high contamination |
| Neural forecast authority | EVO-031 | Zero gain is optimal; stable experts own the floor |
| Context-conditioned calibration | EVO-019 | No correlation + insufficient tail support |
| Mechanism-conditioned calibration | EVO-020 | Spawn association weakened |
| Mode separation for slow tails | EVO-025 | No recurrence in clean profile |

## Run the Full Loop

```powershell
cd "C:\Users\jacks\OneDrive\Desktop\Tessera"
.\scripts\run-tessera-full-loop.ps1
```

```bash
./scripts/run-tessera-full-loop.sh
```

Observer CLI opens first. Worker CLI opens second. Python owns the loop.

## Dashboard

The full interactive dashboard is at [`dashboard/index.html`](./dashboard/index.html) — open it in any browser for:

- Real telemetry AUC comparison (NAB, UCR, SMAP, Yahoo S5)
- Trajectory benchmark radar (Tessera vs Summary vs Recency policies)
- Latency profile (warm, soak, restart, replay, trajectory)
- Evolution progress (tests, lessons, evidence over 45 evolutions)
- Architecture module counts
- Production readiness checklist with pass/fail indicators
- Governance & trust summary (lessons, evidence, authority locks)
- Open items with progress bars

## Repository Structure

```
Tessera/
├── dashboard/
│   ├── index.html                      # Interactive benchmark dashboard
│   └── data.json                       # Benchmark results (auto-generated)
├── agnt-plugin/
│   ├── manifest.json                   # AGNT plugin metadata
│   ├── package.json                    # Package config
│   ├── index.js                        # 5 tool endpoints
│   └── README.md                       # Integration docs
├── src/tessera/
│   ├── cli.py                          # Main CLI entrypoint
│   ├── agent_cli.py                    # Agent CLI mirror
│   ├── loop_runtime.py                 # Loop execution runtime
│   ├── loop_compiler.py                # ASCII loop compiler
│   ├── rhp/core.py                     # RHP-Nexus validation kernel
│   ├── model/                          # TESSERANet, training, prediction experts
│   ├── plugin/                         # 15 modules: runtime, supervisor, capsules, etc.
│   ├── experiments/                    # 29 modules: roadmap operations & readiness suites
│   ├── graph/                          # Topologies, spectral, adaptive
│   ├── metrics/                        # Anomaly, governance, rate-distortion
│   ├── memory/                         # Gates, episodes, certificates, wounds
│   ├── baselines/                      # Persistence, EWMA, PCA, reservoir, etc.
│   ├── data/                           # Synthetic, splits, manifests, adapters
│   ├── evidence/                       # Package writer
│   ├── visuals/                        # Plot utilities
│   └── utils/                          # Paths, hashing
├── tests/                              # 162 tests, 100% pass rate
├── docs/
│   ├── context/rhp/evidence/           # 45 evidence packages
│   ├── geometry/                       # Repository geometry graph
│   ├── lessons/                        # 60 promoted lessons
│   ├── roadmap/                        # Evolutionary roadmap
│   ├── benchmarks/                     # Current public metrics
│   └── research/                       # Preregistrations
├── configs/
│   └── production.json                 # Production runtime config
└── outputs/                            # Runs, evidence, metrics
```

## License & Governance

Tessera is a research reference engine. All results are **scoped** — they do not claim general transfer, production readiness, AGI, consciousness, or autonomous authority. The non-claim lock is active and enforced through 60 promoted lessons.

Full lineage lives in `docs/benchmarks/current_public_metrics.md` and `docs/context/rhp/evidence/`.
