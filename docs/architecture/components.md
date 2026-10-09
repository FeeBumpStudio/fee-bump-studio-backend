# Components

## HTTP Server (`src/server.js`)

### Current Implementation

```javascript
const http = require("http");
const port = Number(process.env.PORT || 8080);
const server = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
  res.statusCode = 404; res.end(JSON.stringify({ error: "not_found" }));
});
server.listen(port, () => console.log(`listening on ${port}`));
```

### Responsibilities

- Create HTTP server on configured port
- Route requests (currently only `/health`)
- Set JSON content type
- Handle 404 for unknown routes
- Graceful startup logging

### Planned Extensions

| Feature | Implementation |
|---------|----------------|
| **Router** | Path-based routing with params |
| **Middleware** | Logging, CORS, rate limiting, auth |
| **Error Handling** | Centralized error formatter |
| **Shutdown** | SIGTERM handling, connection draining |

## Stellar Client (Planned)

### Configuration

```javascript
// lib/stellar-client.js
const { rpc, Config, Networks } = require("@stellar/stellar-sdk");

Config.setDefault({ networkPassphrase: Networks.TESTNET });

const server = new rpc.Server(process.env.STELLAR_RPC_URL, {
  allowHttp: false,
});
```

### Operations

| Operation | Method |
|-----------|--------|
| **Get Latest Ledger** | `server.getLatestLedger()` |
| **Get Events** | `server.getEvents(filters)` |
| **Get Transaction** | `server.getTransaction(hash)` |
| **Simulate Transaction** | `server.simulateTransaction(tx)` |
| **Submit Transaction** | `server.sendTransaction(xdr)` |

## Indexer (Planned)

### Structure

```
lib/
├── indexer/
│   ├── processor.js      # Main ingestion loop
│   ├── filters.js        # Event filtering logic
│   ├── normalizer.js     # Stellar → App schema
│   ├── checkpoint.js     # Ledger checkpoint management
│   └── reorg.js          # Reorganization handling
```

### Processor Loop

```javascript
// lib/indexer/processor.js
async function runProcessor({ rpcUrl, contractIds, db, metrics }) {
  const server = new rpc.Server(rpcUrl);
  let lastLedger = await loadCheckpoint();
  
  while (!shutdown) {
    try {
      const latest = await server.getLatestLedger();
      await processRange(server, lastLedger + 1, latest.sequence);
      lastLedger = latest.sequence;
      await saveCheckpoint(lastLedger);
    } catch (error) {
      metrics.errors.inc();
      await sleep(5000); // Backoff on error
    }
    await sleep(1000); // Poll interval
  }
}
```

## Database Layer (Planned)

### PostgreSQL Schema

```sql
-- Events table
CREATE TABLE events (
  id TEXT PRIMARY KEY,           -- ledger-seq-idx
  ledger BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,            -- 'contract' | 'diagnostic'
  contract_id TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  data JSONB NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_ledger ON events(ledger DESC);
CREATE INDEX idx_events_contract ON events(contract_id, ledger DESC);
CREATE INDEX idx_events_topics ON events USING GIN(topics);
CREATE INDEX idx_events_tx ON events(tx_hash);

-- Checkpoints table
CREATE TABLE checkpoints (
  name TEXT PRIMARY KEY,
  ledger BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (for app-initiated)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,           -- Stellar tx hash
  type TEXT NOT NULL,            -- 'fee_bump', 'contract_call'
  status TEXT NOT NULL,          -- 'pending', 'success', 'failed'
  source_account TEXT NOT NULL,
  fee_bigint NUMERIC(20) NOT NULL,
  ledger BIGINT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Repository Pattern

```javascript
// lib/db/events.js
class EventsRepository {
  constructor(pool) { this.pool = pool; }
  
  async upsert(event) { /* ... */ }
  async findByLedgerRange(from, to) { /* ... */ }
  async findByContract(contractId, { page, limit }) { /* ... */ }
  async findByTransaction(txHash) { /* ... */ }
  async findByTopics(topics, { page, limit }) { /* ... */ }
}
```

## API Handlers (Planned)

### Structure

```
lib/
├── api/
│   ├── routes.js           # Route definitions
│   ├── handlers/
│   │   ├── health.js       # GET /health
│   │   ├── transactions.js # GET/POST /api/v1/transactions
│   │   ├── events.js       # GET /api/v1/events
│   │   └── contracts.js    # GET /api/v1/contracts/:id/events
│   ├── middleware/
│   │   ├── cors.js
│   │   ├── rateLimit.js
│   │   └── validate.js
│   └── errors.js           # Error formatting
```

### Health Handler

```javascript
// lib/api/handlers/health.js
async function healthHandler(req, res) {
  const checks = {
    rpc: await checkRpc(),
    db: await checkDb(),
    contract: await checkContract(),
  };
  
  const healthy = Object.values(checks).every(c => c.ok);
  
  res.statusCode = healthy ? 200 : 503;
  res.end(JSON.stringify({ ok: healthy, checks }));
}
```

## Configuration Module

```javascript
// lib/config.js
function loadConfig() {
  return {
    port: Number(process.env.PORT || 8080),
    stellar: {
      network: process.env.STELLAR_NETWORK || 'testnet',
      rpcUrl: process.env.STELLAR_RPC_URL,
      contractId: process.env.STELLAR_CONTRACT_ID,
    },
    db: {
      url: process.env.DATABASE_URL,
      poolSize: Number(process.env.DB_POOL_SIZE || 10),
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    indexer: {
      pollIntervalMs: Number(process.env.INDEXER_POLL_MS || 1000),
      batchSize: Number(process.env.INDEXER_BATCH_SIZE || 100),
    },
  };
}

module.exports = { loadConfig };
```

## Related Documentation

- [Architecture Overview](overview.md)
- [Data Flow](data-flow.md)
- [API Reference](../api-reference/http-api.md)
- [Operations - Deployment](../operations/deployment.md)