# Frequently Asked Questions

## General

### What is FeeBumpStudio Backend?

FeeBumpStudio Backend is the service and indexing layer that handles work unsuitable for browsers: Stellar data ingestion, API serving, operational data persistence, and background jobs. It does not custody user signing keys.

### Is this production-ready?

**No.** This is a development baseline (v0.1.0). It is **not audited** and **not production-ready**. Do not use with mainnet funds or production credentials.

### Who maintains this?

**Jubilee** ([@Jubilee-001](https://github.com/Jubilee-001)).

### Where is the source code?

- **Backend**: https://github.com/FeeBumpStudio/fee-bump-studio-backend
- **App**: https://github.com/FeeBumpStudio/fee-bump-studio-app
- **Contracts**: https://github.com/FeeBumpStudio/fee-bump-studio-contracts

## Getting Started

### Do I need a Stellar account to run the backend?

For the baseline: **No** — it runs with just the health endpoint.

For full functionality: **Yes** — you need a Testnet contract deployed and RPC access.

### Which RPC provider should I use?

- **Testnet (dev)**: SDF Public (`https://soroban-testnet.stellar.org`) — free, rate-limited
- **Mainnet (prod)**: Dedicated provider required — Stellar RPC, QuickNode, Blockdaemon, or self-hosted

### Why no framework (Express/Fastify)?

The baseline uses Node.js built-in `http` module for zero dependencies and full control. Frameworks can be added as the API grows.

## Technical

### What's the tech stack?

- **Runtime**: Node.js 18+ (built-in `http`, `node:test`)
- **Stellar**: @stellar/stellar-sdk 17.2.1
- **Database**: PostgreSQL (planned), Redis (planned)
- **Deployment**: Docker, Kubernetes (planned)

### How does ingestion work?

1. Poll `getLatestLedger` for current sequence
2. Fetch events via `getEvents` for new ledger range
3. Filter for relevant contract events
4. Normalize to application schema
5. Upsert to database (idempotent)
6. Save checkpoint for resume/reorg handling

### What's the contract for?

The Soroban contract (`FeeBumpStudioContract`) provides minimal on-chain state for verifiable fee-bump event recording. The backend indexes these events for the app.

### Can I run without a database?

Yes, the baseline runs without a database. Persistence features require PostgreSQL.

## Configuration

### Where do I get a contract ID?

Deploy the contract from `fee-bump-studio-contracts`:
```bash
cd fee-bump-studio-contracts
make build
# Deploy via stellar CLI
```

### Why do I need a dedicated RPC for Mainnet?

There is **no public Mainnet RPC**. You must use a provider (Stellar RPC, QuickNode, Blockdaemon, or self-hosted).

### Can I run without a contract?

Yes, the baseline health endpoint works without `STELLAR_CONTRACT_ID`. Ingestion features will be disabled.

## Deployment

### Can I deploy to Kubernetes?

Yes, see [Deployment - Kubernetes](../operations/deployment.md#kubernetes) for example manifests.

### Can I run in Docker?

Yes, a simple `Dockerfile` works. See [Deployment - Docker](../operations/deployment.md#docker).

### What about serverless (Vercel/Cloudflare Workers)?

The current architecture (long-running ingestion) isn't suited for serverless. Consider splitting ingestion into a separate worker service.

## Troubleshooting

### "Network mismatch" error

Your `STELLAR_NETWORK` (testnet/mainnet) doesn't match the RPC endpoint. Ensure both point to the same network.

### "Contract not found"

The `STELLAR_CONTRACT_ID` doesn't exist on the target network. Deploy the contract on that network and update the ID.

### Health check failing

Check dependencies:
- RPC connectivity: `curl -X POST $RPC_URL -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`
- Database connectivity (if configured)
- Contract existence (if configured)

### Ingestion not advancing

Check:
- RPC connectivity and rate limits
- Contract ID matches deployed contract
- Checkpoint table for stuck ledger
- Reorg handling (auto-recovers)

## Contributing

### How can I contribute?

1. Check [GitHub Issues](https://github.com/FeeBumpStudio/fee-bump-studio-backend/issues)
2. Look for `good first issue` labels
3. Fork, create branch, make changes
4. Open PR with description

### What's the development setup?

```bash
git clone https://github.com/FeeBumpStudio/fee-bump-studio-backend.git
cd fee-bump-studio-backend
npm install
cp .env.example .env
npm run dev
```

### Are there coding standards?

- ES modules or CommonJS (consistent)
- Async/await for async operations
- Error handling with try/catch
- `npm test` must pass

## Roadmap

### What's next?

See the [README Roadmap](https://github.com/FeeBumpStudio/fee-bump-studio-backend/blob/main/README.md#roadmap):

1. Full REST API with validation
2. Stellar ingestion pipeline
3. PostgreSQL + Redis integration
4. Authentication + rate limiting
5. Monitoring + alerting
6. Tests + CI/CD

### When will v1.0 release?

No fixed timeline. Depends on community contributions and audit completion.

## Still Have Questions?

- **GitHub Discussions** — Design questions, architecture
- **GitHub Issues** — Bugs, feature requests
- **Discord** — Community chat (if available)
- **Email** — security@feebumpstudio.example.com (security only)