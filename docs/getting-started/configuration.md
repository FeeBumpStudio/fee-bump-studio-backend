# Configuration

## Environment Variables

Copy the example file and customize it:

```bash
cp .env.example .env
```

### `.env.example` Reference

```ini
[TEMPLATE]
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=
STELLAR_CONTRACT_ID=
PORT=8080
```

### Variable Details

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STELLAR_NETWORK` | Yes | `testnet` | Target Stellar network: `testnet` or `mainnet` |
| `STELLAR_RPC_URL` | No | (public default) | Soroban RPC endpoint URL. Leave empty for public Testnet default. For production, use a dedicated RPC provider. |
| `STELLAR_CONTRACT_ID` | Yes* | — | Deployed Soroban contract ID for indexing/interaction. Required for contract features. |
| `PORT` | No | `8080` | Port for the HTTP server |

> *Required when contract indexing features are enabled.

## Network Configuration

### Testnet (Development)

```ini
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=CABC...YOUR_CONTRACT_ID
PORT=8080
```

### Mainnet (Production)

```ini
STELLAR_NETWORK=mainnet
STELLAR_RPC_URL=https://your-dedicated-rpc-provider.com
STELLAR_CONTRACT_ID=CABC...YOUR_CONTRACT_ID
PORT=8080
```

> **Important**: Never commit `.env` or any file containing real credentials. The `.gitignore` excludes `.env*` files while keeping `.env.example`.

## Database Configuration (Planned)

When operational storage is added:

```ini
# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/feebumpstudio
DB_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379
```

## Security Configuration

| Setting | Recommendation |
|---------|----------------|
| **RPC credentials** | Store in secret manager, never in `.env` |
| **Database credentials** | Use connection pooling, rotate regularly |
| **API keys** | Hash before storage, use constant-time comparison |
| **CORS** | Restrict to known app origins |

## Verification

After configuration, verify the environment is loaded correctly:

```bash
npm run dev
```

Check the console for:
- Server startup message: `listening on 8080`
- Network configuration logs
- RPC connection status