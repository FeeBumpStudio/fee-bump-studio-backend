# Prerequisites

## System Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | ≥ 18.x | LTS recommended |
| **npm** | ≥ 9.x | Included with Node.js |
| **Git** | ≥ 2.x | For cloning and version control |

## Network Access

The backend connects to Stellar networks via RPC endpoints:

- **Testnet** (default): `https://soroban-testnet.stellar.org` — Free, public, rate-limited
- **Mainnet**: Requires a dedicated RPC provider (e.g., [Stellar RPC](https://rpc.stellar.org/), [QuickNode](https://www.quicknode.com/), self-hosted)

> **Note**: For production use, always use a dedicated RPC endpoint with appropriate rate limits and SLAs.

## Database (Planned)

When operational storage is implemented:

| Database | Version | Use Case |
|----------|---------|----------|
| **PostgreSQL** | ≥ 14 | Primary operational store |
| **Redis** | ≥ 7 | Caching, rate limiting, queues |

## Recommended Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | Recommended editor |
| **Stellar Laboratory** | Transaction inspection and debugging |
| **Stellar Expert** | Network explorer for Testnet/Mainnet |
| **pgAdmin / DBeaver** | Database management |
| **Prometheus + Grafana** | Monitoring stack |