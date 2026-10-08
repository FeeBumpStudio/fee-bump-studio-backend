# FeeBumpStudio Backend

> Transaction fee-bump preparation toolkit — service and indexing layer.

![Logo](assets/logo.svg)

## Role

A developer workflow for inspecting a transaction, estimating a replacement fee, preparing fee-bump envelopes, and keeping the original transaction intent visible for review.

The backend exists to handle work that should not happen in a browser: indexing,
normalization, scheduled checks, API aggregation, persistence, reconciliation, and
operational diagnostics. It does not custody user signing keys.

## Service boundaries

- **API:** exposes read models and controlled application operations.
- **Indexer/jobs:** consumes Stellar data and converts it into application-friendly records.
- **Storage:** keeps operational data off-chain while retaining references to verifiable
  Stellar events.
- **Observability:** records failures and processing latency without storing secrets.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Reliability

Workers should be idempotent. A network timeout must not silently create a duplicate
business record. Reprocessing the same Stellar event should converge to the same state.

## Security

Never put secret keys in logs. Validate all external input. Keep RPC credentials and
database credentials server-side. Production deployments should add rate limits,
structured logging, backups, alerting, and secret rotation.

## Roadmap

- [ ] Implement project-specific data model
- [ ] Add Stellar ingestion
- [ ] Add retry and idempotency handling
- [ ] Add database migrations
- [ ] Add integration tests
- [ ] Add metrics and structured logs
- [ ] Add production runbook

## Maintainer

Maintainer: 

