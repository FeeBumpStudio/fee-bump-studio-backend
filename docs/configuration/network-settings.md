# Network Settings

## Network Configuration

The backend supports two Stellar networks:

| Network | Passphrase | Use Case |
|---------|------------|----------|
| **Testnet** | `Test SDF Network ; September 2015` | Development, testing, CI |
| **Mainnet** | `Public Global Stellar Network ; September 2015` | Production |

## RPC Endpoints

### Testnet

| Provider | URL | Notes |
|----------|-----|-------|
| **SDF Public** | `https://soroban-testnet.stellar.org` | Free, rate-limited, default |
| **QuickNode** | `https://your-endpoint.quicknode.com` | Paid, higher limits |
| **Self-hosted** | `https://your-rpc.example.com` | Full control |

### Mainnet

| Provider | URL | Notes |
|----------|-----|-------|
| **Stellar RPC** | `https://rpc.stellar.org/your-project-id` | Official managed service |
| **QuickNode** | `https://your-endpoint.quicknode.com` | Multi-chain provider |
| **Blockdaemon** | `https://your-endpoint.blockdaemon.com` | Enterprise |
| **Self-hosted** | `https://your-rpc.example.com` | Full control |

> **Mainnet requires a dedicated RPC endpoint.** No public default exists.

## Contract Deployment Per Network

Contracts must be deployed separately per network:

| Network | Contract ID | Deployment |
|---------|-------------|------------|
| Testnet | `CABC...TESTNET` | `make deploy-testnet` |
| Mainnet | `CXYZ...MAINNET` | `make deploy-mainnet` |

Set `STELLAR_CONTRACT_ID` to match the target network.

## Network Validation

The backend validates network configuration on startup:

```javascript
async function validateNetwork(rpcUrl, expectedPassphrase) {
  const server = new rpc.Server(rpcUrl);
  const ledger = await server.getLatestLedger();
  
  // Verify network passphrase matches
  const networkConfig = await server.getNetworkConfig();
  if (networkConfig.networkPassphrase !== expectedPassphrase) {
    throw new Error(`Network mismatch: expected ${expectedPassphrase}, got ${networkConfig.networkPassphrase}`);
  }
  
  return ledger.sequence;
}
```

## Rate Limits

| Provider | Testnet Limit | Mainnet Limit |
|----------|---------------|---------------|
| SDF Public | 100 req/min | N/A |
| Stellar RPC | N/A | Tier-based |
| QuickNode | Plan-based | Plan-based |
| Self-hosted | Configurable | Configurable |

## Monitoring

Recommended alerts:

- RPC error rate > 5%
- RPC latency > 2s (p95)
- Rate limit approaching 80%
- Ledger sync lag > 30s

## Troubleshooting

| Issue | Check |
|-------|-------|
| "Network mismatch" | Verify `STELLAR_NETWORK` matches RPC endpoint |
| "Contract not found" | Ensure contract deployed on target network |
| "RPC connection failed" | Check URL, firewall, provider status |
| "Rate limited" | Upgrade plan or implement backoff |

## Related Documentation

- [Environment Variables](environment-variables.md)
- [Operations - Deployment](../operations/deployment.md)
- [Stellar Networks](https://developers.stellar.org/docs/learn/fundamentals/networks)