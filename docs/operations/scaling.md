# Scaling

## Horizontal Scaling

### Stateless API

The HTTP API is designed to be stateless:

```yaml
# Scale by adding replicas
replicas: 3  # or more behind load balancer
```

### Load Balancing

| Layer | Method |
|-------|--------|
| **Kubernetes** | Service + Ingress |
| **Docker Swarm** | Overlay network + VIP |
| **VM/Cloud** | nginx/HAProxy/ALB |

### Session Affinity

**Not required** — No sticky sessions needed.

## Database Scaling

### Read Replicas

```yaml
# Primary for writes
- host: db-primary
  role: primary

# Replicas for reads
- host: db-replica-1
  role: replica
- host: db-replica-2
  role: replica
```

### Connection Pooling

```yaml
# PgBouncer for connection multiplexing
pgbouncer:
  pool_mode: transaction
  max_client_conn: 1000
  default_pool_size: 25
```

### Partitioning (Future)

| Table | Strategy |
|-------|----------|
| `events` | Partition by `ledger` (monthly) |
| `transactions` | Partition by `created_at` (monthly) |

## Ingestion Scaling

### Single Writer Constraint

Only **one ingestion process** should run to avoid duplicate events:

```yaml
# Kubernetes: single replica for ingestion
ingestion:
  replicas: 1
```

### Horizontal Ingestion (Future)

If volume requires:
1. **Shard by contract** — Each worker handles subset of contracts
2. **Shard by ledger range** — Coordinated via distributed lock
3. **Use Kafka/Redis Streams** — Partitioned event log

## Caching Strategy

### Redis for Hot Data

| Data | TTL | Invalidation |
|------|-----|--------------|
| Contract events (recent) | 60s | On new ledger |
| Transaction status | 30s | On status change |
| Rate limit counters | 60s | Auto-expiry |

### Cache Warming

```javascript
// On startup, warm cache for active contracts
async function warmCache() {
  const activeContracts = await getActiveContracts();
  for (const contract of activeContracts) {
    const events = await getRecentEvents(contract, 100);
    await cache.set(`events:${contract}`, events, 60);
  }
}
```

## Rate Limiting

### Per-Client Limits

```javascript
// Token bucket per IP
const limits = {
  anonymous: { rate: 60, burst: 10 },   // req/min
  authenticated: { rate: 300, burst: 50 },
  admin: { rate: 1000, burst: 200 },
};
```

### Distributed Rate Limiting

```javascript
// Redis-backed token bucket
async function checkRateLimit(key, limit) {
  const luaScript = `
    local current = redis.call('GET', KEYS[1])
    if current and tonumber(current) >= tonumber(ARGV[1]) then
      return 0
    end
    redis.call('INCR', KEYS[1])
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return 1
  `;
  return redis.eval(luaScript, 1, key, limit.rate, 60);
}
```

## Resource Planning

### Baseline Requirements

| Component | CPU | Memory | Disk |
|-----------|-----|--------|------|
| **API (per replica)** | 0.1 core | 128 MB | 100 MB |
| **Ingestion (single)** | 0.25 core | 256 MB | 500 MB |
| **PostgreSQL** | 1 core | 2 GB | 50 GB+ |
| **Redis** | 0.1 core | 256 MB | 1 GB |

### Scaling Triggers

| Metric | Scale Up | Scale Down |
|--------|----------|------------|
| **CPU (API)** | > 70% for 5m | < 30% for 15m |
| **Memory (API)** | > 80% for 5m | < 50% for 15m |
| **Request latency (p99)** | > 2s for 5m | < 500ms for 15m |
| **Ingestion lag** | > 100 ledgers | < 10 ledgers |

## Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fee-bump-studio-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fee-bump-studio-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
    scaleUp:
      stabilizationWindowSeconds: 60
```

## Cost Optimization

| Strategy | Savings |
|----------|---------|
| **Spot instances** for ingestion | 60-90% |
| **Right-sizing** containers | 20-40% |
| **Read replicas** for query load | Avoid primary upgrade |
| **Caching** reduces DB load | 50%+ query reduction |
| **Scheduled scaling** (dev env) | 100% off-hours |

## Related Documentation

- [Deployment](../operations/deployment.md)
- [Monitoring](../operations/monitoring.md)
- [Architecture - Overview](../architecture/overview.md)