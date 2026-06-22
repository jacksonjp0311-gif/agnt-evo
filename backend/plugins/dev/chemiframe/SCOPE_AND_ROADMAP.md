# CHEMIFRAME AGNT Plugin — Expansion Plan & Integration Scope

This document defines the 3-month expansion plan to integrate **Real-Time Lab Hardware Integration**, **AI-Powered Retrosynthesis with LLMs**, and **Reaction Database Integration** into the existing CHEMIFRAME AGNT plugin, plus a full UI scope to monitor and watch as you synthesize chemicals.

---

## 🎯 Goal

Extend the CHEMIFRAME plugin from a planning/compile-only tool into an end-to-end **real-time, hardware-in-the-loop synthesis system** with:
- Live hardware adapter support (Opentrons, HPLC, reactors) via XDL
- On-device and cloud LLM-powered retrosynthesis beyond the 14 templates
- Trusted reaction database lookups (PubChem/ChEMBL/Reaxys)
- A rich "watch" UI that monitors synthesis steps, metrics, and alerts in real time

---

## 🗓️ 9-Week Delivery Plan

### Week 0–2 — MVP
| Area | Deliverable | Owner | Acceptance Criteria |
|------|------------|-------|----------------------|
| Hardware | Opentrons OT-2 XDL adapter (`hardware:opentrons:ot2`) | Engineer A | One working loop: load → mix → incubate → read; XDL step maps to OT-2 commands |
| Reaction DB | PubChem & ChEMBL read-only cached lookup | Engineer B | API `/reactions?smiles=` returns matching reactions + conditions within 200ms (cache) |
| Retrosynthesis | Local LLaMA-3.2-3B Q8_0 for disconnection | Engineer A + ML Engineer | Returns JSON: target, precursors, reagents, yield%, confidence, citations; runs in <15s on CPU |
| Watch/Monitor | Basic route watch page | Engineer C | Live step list, XDL event stream, KPI tiles (temp/time), step-stall alert >30min |
| **Milestone** | 1 working hardware loop, 1 route with DB lookups, local retro, watch MVP | — | All acceptance criteria met; smoke tests pass |

**Key integrations**
- XDL extension: add `hardware` step type with adapter URI and parameters
- Retrosynthesis endpoint: `/api/retrosynthesis` (POST {target|smiles} → {routes[]})
- Reaction DB endpoint: `/api/reactions?smiles=...`
- XDL events: custom `event:hplc:peak` and `event:temp` streamed to UI

---

### Week 3–5 — Beta
| Area | Deliverable | Owner | Acceptance Criteria |
|------|------------|-------|----------------------|
| Hardware | Add HPLC & Reactor adapters | Engineer A | HPLC AUC stream → XDL event; reactor temp/plate read/write via XDL |
| Cost Optimizer | Sigma price feed + route ranking | Engineer B | Given route, returns $/step and total cost, ranks alternative routes |
| Retrosynthesis UI | SMILES/name → tree of disconnections | Engineer C | Interactive tree with scores, refs, and one-click to route cards |
| Rich Watch Dashboard | Per-step KPI tiles, alerts, substeps | Engineer C | Threshold crossing (HPLC%), step duration SLA, resource usage |
| **Milestone** | 3 hardware types looped, cost-ranked routes, retrosynthesis UI, advanced watch | — |

**Data flows**
- Hardware → XDL event stream → Watch page (real-time)
- Retrosynthesis → route cards → Compile → Validate → Simulate
- Reaction DB lookup embedded in route cards (cite refs, yield ranges)

---

### Week 6–9 — GA (Production)
| Area | Deliverable | Owner | Acceptance Criteria |
|------|------------|-------|----------------------|
| Multi-step Campaign Planner | Parallel/sequential ops, resource scheduler | Engineer A + Engineer C | Given a multi-route campaign, generates schedule, detects conflicts, optimizes equipment time |
| Model Hub | Pluggable LLM providers (local, OpenAI, Anthropic) | Engineer B | Same JSON schema across providers; fallback routing based on confidence/cost |
| Sharing / Fork | Route share links, diff, fork, ratings | Engineer C | Public/private routes, fork tree, ratings + citations preserved |
| RBAC & Audit | Roles, permissions, audit log | Engineer B | Per-org routes, read/write/execute roles, immutable audit trail |
| **Milestone** | End-to-end multi-step campaign, sharing, RBAC, audit SLOs met | — |

**Post-GA nice-to-haves** (future roadmap)
- More hardware adapters (reactors, balances, pH/DO sensors)
- Reaction prediction (forward synthesis) from LLM
- Integration with lab LIMS/ELN
- Notebook-style protocol authoring (inline Python/JS)

---

## Feature Scope: What's IN vs OUT

### 1) Real-Time Lab Hardware Integration (XDL)
- **IN:**
  - XDL step type `hardware:<vendor>:<device>`
  - Proof-of-concept: Opentrons OT-2 (liquid handler)
  - Event streaming: temperature ramp, plate maps, HPLC AUC events
- **OUT (post-MVP):**
  - Full adapter catalog (reactors, heaters, balances, pH/DO, turbidity) — roadmap only

### 2) AI-Powered Retrosynthesis with LLMs
- **IN:**
  - Local quantized LLaMA-3.2-3B (Q8_0) for disconnection
  - Cloud fallback (OpenAI o3-mini / Anthropic) with identical JSON schema
  - Output schema: target, precursors[], reagents[], yield%, confidence, citations[]
- **OUT:**
  - Multi-target multi-step retrosynthesis tree in single call (post-MVP)
  - User-curated reaction templates (import/export)

### 3) Reaction Database Integration
- **IN:**
  - PubChem PUG-REST for reactions & conditions
  - ChEMBL reaction endpoints (reagent pairs, yields)
  - Local SQLite cache + nightly refresh
- **OUT:**
  - Write/submit reactions to public databases (auth required)

### 4) UI for Monitoring & Synthesis (Full Scope)
- **MVP Watch:**
  - Live step list, XDL event stream, KPI tiles (temp/time/AUC)
  - Step-stall alert (>30 min)
- **Beta:**
  - Cost breakdown per step
  - Multi-step timeline with parallel ops
  - Retrosynthesis viewer (tree + cards)
- **GA:**
  - Fork/Share routes, diff, ratings, public templates
  - Permissions: private org routes, public/gallery

---

## Team & Effort Estimate

- Lead Engineer (XDL + adapters + CI): 20–25 hrs/week
- Python ML Engineer (local model + fallback): 15–20 hrs/week
- Full-Stack Engineer (UI + API): 20–25 hrs/week
- DevOps/Infra (containers, secrets, GPU): 5–10 hrs/week
- QA/Tester (hardware-in-loop + acceptance): 10 hrs/week
TOTAL: ~60–80 hrs/week depending on parallel work

---

## Cost Estimate (rough USD)

- Cloud GPU (A10g g4dn.xlarge 24/7 for 3 months): ~$1,100
- Storage + egress: ~$200
- Engineering (blended $75/hr):
  - 70 hrs/wk × 9 wks × $75 ≈ $47,000
- Contingency (20%): ~$10,000
TOTAL ESTIMATE: $50k–$65k
If you already own Opentrons/HPLC/controllers, hardware line items drop and cloud GPU can be reduced → total ≈ $20k–$30k.

---

## Risks & Mitigations

- Adapter compatibility: start with OT-2 only; wrap each adapter behind uniform XDL step interface
- LLM hallucination: local model + cloud fallback + citation + confidence threshold to reject low-confidence outputs
- API rate limits: nightly caches; exponential backoff; graceful degradation to cached data

---

## Acceptance Summary

**MVP Definition of Done:**
- XDL adapter for one hardware type that executes a documented route
- Reaction DB lookups with ≤200ms 95th percentile response
- Local retrosynthesis endpoint with confidence scores and citations
- Watch page showing live step state and KPI alerts

If you approve, I’ll generate the detailed user stories, the Jira/Asana milestone structure, and the initial requirements spec for engineering.