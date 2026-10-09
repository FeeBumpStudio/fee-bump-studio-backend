# Health Endpoint

## Overview

The `/health` endpoint provides a simple liveness/readiness probe for load balancers, orchestration systems, and monitoring.

## Endpoint

```
GET /health
```

## Response

### Healthy (200 OK)

```json
{
  "ok": true
}
```

### Degraded (503 Service Unavailable) — Future

```json
{
  "ok": false,
  "checks": {
    "rpc": { "ok": true, "latency_ms": 45 },
    "db": { "ok": true, "latency_ms": 12 },
    "contract": { "ok": false, "error": "not initialized" }
  }
}
```

## Usage

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
```

### Load Balancer (nginx/HAProxy)

```
option httpchk GET /health
http-check expect status 200
```

### curl Manual Check

```bash
curl -f http://localhost:8080/health
# Exit code 0 = healthy, non-zero = unhealthy
```

## Implementation

### Current (Minimal)

```javascript
// src/server.js
if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
```

### Planned (With Dependency Checks)

```javascript
// lib/api/handlers/health.js
async function healthHandler(req, res) {
  const checks = await Promise.allSettled([
    checkRpc(),
    checkDatabase(),
    checkContract(),
  ]);
  
  const results = {
    rpc: checks[0].status === 'fulfilled' ? checks[0].value : { ok: false, error: checks[0].reason.message },
    db: checks[1].status === 'fulfilled' ? checks[1].value : { ok: false, error: checks[1].reason.message },
    contract: checks[2].status === 'fulfilled' ? checks[2].value : { ok: false, error: checks[2].reason.message },
  };
  
  const healthy = Object.values(results).every(c => c.ok);
  
  res.statusCode = healthy ? 200 : 503;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: healthy, checks }));
}

async function checkRpc() {
  const start = Date.now();
  await server.getLatestLedger();
  return { ok: true, latency_ms: Date.now() - start };
}

async function checkDatabase() {
  const start = Date.now();
  await pool.query('SELECT 1');
  return { ok: true, latency_ms: Date.now() - start };
}

async function checkContract() {
  if (!config.stellar.contractId) return { ok: true, skipped: true };
  // Verify contract exists and is initialized
  return { ok: true };
}
```

## Monitoring Integration

### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'fee-bump-studio-backend'
    metrics_path: /health
    static_configs:
      - targets: ['backend:8080']
```

### Grafana Alert

```yaml
# Alert: Backend unhealthy
expr: up{job="fee-bump-studio-backend"} == 0
for: 1m
labels:
  severity: critical
annotations:
  summary: "FeeBumpStudio Backend down"
```

## Security

- **No authentication** — Health checks must be publicly accessible
- **No sensitive data** — Response contains only status
- **Rate limiting** — May be excluded from rate limits

## Related Documentation

- [HTTP API](../api-reference/http-api.md)
- [Operations - Monitoring](../operations/monitoring.md)
- [Operations - Deployment](../operations/deployment.md)