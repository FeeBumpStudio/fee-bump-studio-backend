# Database Configuration

## PostgreSQL (Planned)

### Connection

```ini
# .env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DB_POOL_SIZE=10
```

### Connection Pooling

| Setting | Value | Description |
|---------|-------|-------------|
| `DB_POOL_SIZE` | 10 | Max connections in pool |
| `idle_timeout` | 30000 | ms before closing idle |
| `connection_timeout` | 5000 | ms to wait for connection |

### SSL Configuration

| Environment | `sslmode` |
|-------------|-----------|
| Local (no TLS) | `disable` |
| Managed (RDS, Cloud SQL) | `require` |
| Self-hosted with CA | `verify-ca` or `verify-full` |

### Migrations

```bash
# Run migrations
npm run db:migrate

# Create migration
npm run db:migrate:create -- --name add_events_table
```

### Schema Overview

```sql
-- Events table
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  ledger BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
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

-- Checkpoints
CREATE TABLE checkpoints (
  name TEXT PRIMARY KEY,
  ledger BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (app-initiated)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  source_account TEXT NOT NULL,
  fee_bigint NUMERIC(20) NOT NULL,
  ledger BIGINT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Redis (Planned)

### Connection

```ini
# .env
REDIS_URL=redis://localhost:6379
```

### Use Cases

| Use Case | Data Structure | TTL |
|----------|----------------|-----|
| **Rate limiting** | `ratelimit:{ip}:{endpoint}` → counter | 60s |
| **Caching** | `cache:{key}` → JSON | 300s |
| **Job queue** | `queue:{name}` → list (LPUSH/RPOP) | — |
| **Idempotency keys** | `idempotency:{key}` → "processed" | 24h |

### Connection Pool

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

client.on('error', (err) => console.error('Redis error:', err));
await client.connect();
```

## Backup Strategy

### PostgreSQL

| Frequency | Method | Retention |
|-----------|--------|-----------|
| **Continuous** | WAL archiving | 7 days |
| **Daily** | `pg_dump` | 30 days |
| **Weekly** | Base backup | 90 days |

### Redis

- **RDB snapshots** — Every 60s if 1+ keys changed
- **AOF** — Every second (fsync)

## Monitoring

### PostgreSQL Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| `pg_connections_active` | > 80% of pool |
| `pg_replication_lag` | > 10s |
| `pg_database_size` | > 80% disk |
| `pg_stat_statements` | Slow queries > 1s |

### Redis Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| `redis_connected_clients` | > 80% max |
| `redis_memory_used_bytes` | > 80% maxmemory |
| `redis_keyspace_misses` | High miss ratio |

## Related Documentation

- [Environment Variables](environment-variables.md)
- [Architecture - Components](../architecture/components.md)
- [Operations - Deployment](../operations/deployment.md)