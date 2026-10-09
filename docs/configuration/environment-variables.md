# Environment Variables

## Complete Reference

All environment variables for the FeeBumpStudio Backend:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STELLAR_NETWORK` | Yes | `testnet` | Target network: `testnet` or `mainnet` |
| `STELLAR_RPC_URL` | No | (public default) | Soroban RPC endpoint URL |
| `STELLAR_CONTRACT_ID` | Yes* | — | Deployed contract ID |
| `PORT` | No | `8080` | HTTP server port |
| `DATABASE_URL` | No** | — | PostgreSQL connection string |
| `DB_POOL_SIZE` | No | `10` | Database connection pool size |
| `REDIS_URL` | No** | — | Redis connection string |
| `INDEXER_POLL_MS` | No | `1000` | Ingestion poll interval (ms) |
| `INDEXER_BATCH_SIZE` | No | `100` | Events per batch |

> *Required for contract indexing features.
> **Required when database/Redis features are enabled.

## Variable Details

### STELLAR_NETWORK

```ini
# Testnet (development)
STELLAR_NETWORK=testnet

# Mainnet (production)
STELLAR_NETWORK=mainnet
```

Controls:
- Network passphrase for Stellar SDK
- Default RPC endpoint if `STELLAR_RPC_URL` not set

### STELLAR_RPC_URL

```ini
# Use public Testnet (development only)
STELLAR_RPC_URL=

# Dedicated RPC (recommended for production)
STELLAR_RPC_URL=https://rpc.stellar.org/your-project-id
STELLAR_RPC_URL=https://your-endpoint.quicknode.com/your-token
```

If empty:
- Testnet → `https://soroban-testnet.stellar.org`
- Mainnet → **Required** (no public default)

### STELLAR_CONTRACT_ID

```ini
# Contract ID from deployment
STELLAR_CONTRACT_ID=CABC123...YOUR_CONTRACT_ID
```

Format: Stellar address starting with `C` (contract)

### PORT

```ini
# Default
PORT=8080

# Alternative
PORT=3000
```

### DATABASE_URL (Planned)

```ini
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# With pooler (PgBouncer)
DATABASE_URL=postgresql://user:password@host:6432/database?sslmode=require
```

### REDIS_URL (Planned)

```ini
# Standard
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# TLS (Upstash, etc.)
REDIS_URL=rediss://user:password@host:6379
```

### Indexer Tuning

```ini
# Poll every 5 seconds (less aggressive)
INDEXER_POLL_MS=5000

# Larger batches for throughput
INDEXER_BATCH_SIZE=500
```

## Environment Files

### .env.example (Committed)

Template with all variables:

```ini
[TEMPLATE]
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=
STELLAR_CONTRACT_ID=
PORT=8080
```

### .env (Local Only, Gitignored)

Your actual configuration:

```ini
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=CABC123...YOUR_CONTRACT_ID
PORT=8080
```

### .env.production (Deployment)

For production deployments:

```ini
STELLAR_NETWORK=mainnet
STELLAR_RPC_URL=https://rpc.stellar.org/your-production-project
STELLAR_CONTRACT_ID=CXYZ789...YOUR_MAINNET_CONTRACT
PORT=8080
DATABASE_URL=postgresql://user:pass@db:5432/feebumpstudio
REDIS_URL=redis://redis:6379
```

## Loading Priority

Node.js loads in order (highest priority wins):

1. System environment variables
2. `.env` (via `dotenv` if used)
3. Defaults in code

## Validation

```javascript
// lib/config.js
function validateConfig(config) {
  if (!['testnet', 'mainnet'].includes(config.stellar.network)) {
    throw new Error(`Invalid STELLAR_NETWORK: ${config.stellar.network}`);
  }
  
  if (config.stellar.network === 'mainnet' && !config.stellar.rpcUrl) {
    throw new Error('STELLAR_RPC_URL required for mainnet');
  }
  
  if (config.stellar.contractId && !config.stellar.contractId.startsWith('C')) {
    throw new Error('STELLAR_CONTRACT_ID must be a contract address (starts with C)');
  }
  
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT: ${config.port}`);
  }
}
```

## Security Checklist

- [ ] Never commit `.env`, `.env.production`, or any `.env.*` with real values
- [ ] Use different contract IDs for Testnet/Mainnet
- [ ] Use dedicated RPC for production
- [ ] Store database credentials in secret manager
- [ ] Rotate RPC credentials periodically
- [ ] Monitor RPC usage and rate limits

## CI/CD Variables

Set in GitHub repository settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `STELLAR_NETWORK` | Deployment target network |
| `STELLAR_RPC_URL` | RPC for deployment verification |
| `STELLAR_CONTRACT_ID` | Contract to verify against |
| `DATABASE_URL` | Production database |
| `REDIS_URL` | Production Redis |

## Related Documentation

- [Network Settings](network-settings.md)
- [Database Configuration](database.md)
- [Operations - Deployment](../operations/deployment.md)
- [Security - Assumptions](../security/assumptions.md)