# Reaction Database Integration Specification

## Overview

This spec defines the read-only reaction database integration for CHEMIFRAME. It provides a local cache of reactions from PubChem and ChEMBL, keyed by SMILES, with condition and yield metadata. The goal is fast (>200ms p95) lookups for "Does this reaction exist?" and "What conditions give reasonable yields?" during route planning and retrosynthesis.

## API

### GET /api/reactions
Query the cached reaction set.

Query parameters:
- `smiles` (required): substrate SMILES
- `reagent` (optional): reagent or catalyst SMILES
- `max_results` (optional, default: 20)
- `include_conditions` (optional, boolean, default: true)

Response schema:
```json
{
  "query": { "smiles": "...", "reagent": "..." },
  "results": [
    {
      "source": "pubchem|chembl",
      "id": "pubchem AID/chembl ID",
      "smiles": "string",
      "reagents": ["..."],
      "conditions": {
        "temperature": "string",
        "solvent": "string",
        "catalyst": "string",
        "yield_percent": "number|null",
        "byproducts": ["..."]
      },
      "references": [{"doi":"...","pmid":"..."}]
    }
  ],
  "cache_age_hours": "age of local snapshot"
}
```

## Data Sources & Refresh

- PubChem PUG-REST: reaction endpoints (https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest)
- ChEMBL: reaction API (https://www.ebi.ac.uk/chembl/api/data)
- Nightly snapshot saved to `data/reactions.db` (SQLite)
- Schema:
  - reactions(id, source_id, smiles, json)
  - reaction_conditions(reaction_id, key, value, units)
  - reaction_refs(reaction_id, doi, pmid)

## Caching Strategy
- Local SQLite keyed by canonical SMILES+reagent
- TTL: nightly refresh; cache_age_hours exposed in API response
- If cache is stale (>24h), API returns warnings but serves data

## Performance Targets
- Cold query: <300ms
- Warm query: <200ms p95
- Concurrent users: 100 (cache serves reads)

## Security & Rate Limiting
- Read-only; no write paths from this API
- Optional upstream API keys for ChEMBL (configurable)
- Rate limit: 100 req/min per IP (cache-first)

## Future Extensions
- Write path to submit new reactions (admin-only)
- Synonyms and salt-stripping heuristics
- Condition similarity search (e.g., find reactions within ±5°C)