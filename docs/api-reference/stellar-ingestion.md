# Stellar Ingestion

## Overview

The ingestion system consumes Stellar ledger data via RPC and normalizes it for application consumption.

## RPC Methods Used

| Method | Purpose | Frequency |
|--------|---------|-----------|
| `getLatestLedger` | Get current ledger sequence | Every poll interval |
| `getEvents` | Fetch events for ledger range | Per ledger range |
| `getTransaction` | Fetch transaction details | On-demand / enrichment |
| `getNetworkConfig` | Verify network passphrase | Startup |

## Event Fetching

### Request

```javascript
const events = await server.getEvents({
  startLedger: 12345000,
  endLedger: 12345100,
  filters: [
    { type: 'contract', contractIds: ['CABC...CONTRACT'] },
    { type: 'diagnostic' }, // For error detection
  ],
});
```

### Response Structure

```typescript
interface RpcEvent {
  id: string;                    // "12345000-0"
  ledger: number;                // 12345000
  ledgerClosedAt: string;        // "2024-01-15T10:30:00Z"
  type: 'contract' | 'diagnostic';
  contractId?: string;           // For contract events
  topic?: string;                // Event topic
  topics?: string[];             // All topics
  body?: {                       // Contract event body
    topics: xdr.ScVal[];
    data: xdr.ScVal;
  };
  diagnosticEvent?: {            // Diagnostic event
    event: {
      topics: string[];
      data: string[];
    };
  };
  txHash: string;                // Parent transaction hash
}
```

## Filtering Strategy

### Contract Events

```javascript
const CONTRACT_FILTERS = [
  {
    type: 'contract',
    contractIds: [process.env.STELLAR_CONTRACT_ID],
  },
];
```

### Diagnostic Events

```javascript
const DIAGNOSTIC_FILTERS = [
  { type: 'diagnostic' },
];
```

Capture for:
- Failed transactions (for alerting)
- Contract errors (for debugging)
- Budget exceeded events

## Normalization

### Contract Event → Application Event

```javascript
function normalizeContractEvent(rpcEvent) {
  // Decode ScVal topics and data
  const decodedTopics = rpcEvent.body.topics.map(decodeScVal);
  const decodedData = decodeScVal(rpcEvent.body.data);
  
  return {
    id: rpcEvent.id,
    ledger: rpcEvent.ledger,
    timestamp: new Date(rpcEvent.ledgerClosedAt),
    type: 'contract',
    contractId: rpcEvent.contractId,
    topics: decodedTopics,
    data: decodedData,
    transactionHash: rpcEvent.txHash,
  };
}
```

### Diagnostic Event → Application Event

```javascript
function normalizeDiagnosticEvent(rpcEvent) {
  return {
    id: rpcEvent.id,
    ledger: rpcEvent.ledger,
    timestamp: new Date(rpcEvent.ledgerClosedAt),
    type: 'diagnostic',
    topics: rpcEvent.diagnosticEvent.event.topics,
    data: rpcEvent.diagnosticEvent.event.data,
    transactionHash: rpcEvent.txHash,
  };
}
```

## ScVal Decoding

```javascript
const { xdr, ScVal } = require("@stellar/stellar-sdk");

function decodeScVal(scVal) {
  switch (scVal.switch().name) {
    case 'scvString':
      return scVal.string().toString();
    case 'scvSymbol':
      return scVal.sym().toString();
    case 'scvAddress':
      return addressToString(scVal.address());
    case 'scvU64':
    case 'scvI64':
    case 'scvU128':
    case 'scvI128':
      return scVal.u64().toString(); // or BigInt
    case 'scvBytes':
      return Buffer.from(scVal.bytes()).toString('hex');
    case 'scvVec':
      return scVal.vec().map(decodeScVal);
    case 'scvMap':
      return Object.fromEntries(
        scVal.map().map(([k, v]) => [decodeScVal(k), decodeScVal(v)])
      );
    default:
      return scVal.toString(); // Fallback
  }
}

function addressToString(address) {
  if (address.switch().name === 'scAddressTypeAccount') {
    return StrKey.encodeEd25519PublicKey(address.accountId().ed25519());
  }
  if (address.switch().name === 'scAddressTypeContract') {
    return StrKey.encodeContract(address.contractId());
  }
  throw new Error('Unknown address type');
}
```

## Idempotency

### Event ID as Primary Key

```javascript
// Event ID format: "ledgerSequence-eventIndex"
// e.g., "12345678-0", "12345678-1"
const eventId = `${rpcEvent.ledger}-${eventIndex}`;
```

### Database Upsert

```sql
INSERT INTO events (id, ledger, timestamp, type, contract_id, topics, data, tx_hash)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) DO UPDATE SET
  ledger = EXCLUDED.ledger,
  timestamp = EXCLUDED.timestamp,
  type = EXCLUDED.type,
  contract_id = EXCLUDED.contract_id,
  topics = EXCLUDED.topics,
  data = EXCLUDED.data,
  tx_hash = EXCLUDED.tx_hash;
```

## Checkpoint Management

### Save Checkpoint

```javascript
async function saveCheckpoint(ledger) {
  await pool.query(
    `INSERT INTO checkpoints (name, ledger) VALUES ('ingestion', $1)
     ON CONFLICT (name) DO UPDATE SET ledger = $1, updated_at = NOW()`,
    [ledger]
  );
}
```

### Load Checkpoint

```javascript
async function loadCheckpoint() {
  const result = await pool.query(
    `SELECT ledger FROM checkpoints WHERE name = 'ingestion'`
  );
  return result.rows[0]?.ledger ?? 0;
}
```

## Reorganization Handling

### Detection

```javascript
async function detectReorg() {
  const latest = await server.getLatestLedger();
  const checkpoint = await loadCheckpoint();
  
  if (latest.sequence < checkpoint) {
    // Reorg detected!
    console.warn(`Reorg detected: checkpoint ${checkpoint} > latest ${latest.sequence}`);
    return true;
  }
  return false;
}
```

### Recovery

```javascript
async function recoverFromReorg() {
  const latest = await server.getLatestLedger();
  
  // 1. Delete orphaned events
  await pool.query(
    `DELETE FROM events WHERE ledger > $1`,
    [latest.sequence]
  );
  
  // 2. Reset checkpoint
  await saveCheckpoint(latest.sequence);
  
  // 3. Next poll will reprocess from latest.sequence + 1
}
```

## Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `ingestion_ledgers_processed_total` | Counter | — | Ledgers successfully processed |
| `ingestion_events_total` | Counter | `type` (contract/diagnostic) | Events ingested |
| `ingestion_latency_seconds` | Histogram | — | Time to process ledger range |
| `ingestion_reorgs_total` | Counter | — | Reorganizations detected |
| `ingestion_errors_total` | Counter | `error_type` | Processing errors |

## Configuration

```javascript
const ingestionConfig = {
  pollIntervalMs: Number(process.env.INDEXER_POLL_MS) || 1000,
  batchSize: Number(process.env.INDEXER_BATCH_SIZE) || 100,
  maxRetries: 3,
  retryDelayMs: 5000,
  contractIds: [process.env.STELLAR_CONTRACT_ID].filter(Boolean),
};
```

## Related Documentation

- [Architecture - Data Flow](../architecture/data-flow.md)
- [HTTP API](../api-reference/http-api.md)
- [Operations - Monitoring](../operations/monitoring.md)