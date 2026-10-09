# Monitoring

## Metrics

### Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by method, path, status |
| `http_request_duration_seconds` | Histogram | Request latency by method, path |
| `health_check_status` | Gauge | 1 = healthy, 0 = unhealthy |
| `process_uptime_seconds` | Gauge | Process uptime |

### Ingestion Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `ingestion_ledgers_processed_total` | Counter | — | Ledgers successfully processed |
| `ingestion_events_total` | Counter | `type` | Events ingested |
| `ingestion_latency_seconds` | Histogram | — | Time to process ledger range |
| `ingestion_reorgs_total` | Counter | — | Reorganizations detected |
| `ingestion_errors_total` | Counter | `error_type` | Processing errors |

### Dependency Metrics

| Metric | Type | Source |
|--------|------|--------|
| `rpc_requests_total` | Counter | Stellar SDK / custom |
| `rpc_latency_seconds` | Histogram | Stellar SDK / custom |
| `db_query_duration_seconds` | Histogram | pg / custom |
| `redis_commands_total` | Counter | redis client |

## Logging

### Structured Logging

```javascript
// lib/logger.js
const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: Date.now() })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn', msg, ...meta, ts: Date.now() })),
  error: (msg, error, meta = {}) => console.error(JSON.stringify({ 
    level: 'error', msg, error: error?.message, stack: error?.stack, ...meta, ts: Date.now() 
  })),
};

module.exports = logger;
```

### Log Format

```json
{
  "level": "info",
  "msg": "Ledger processed",
  "ledger": 12345678,
  "events": 3,
  "latency_ms": 45,
  "ts": 1705312200000
}
```

### Log Levels

| Level | Use Case |
|-------|----------|
| `error` | Failures requiring action |
| `warn` | Degraded state, retries |
| `info` | Normal operations (ledger processed, request received) |
| `debug` | Detailed flow (RPC requests, DB queries) |

## Alerting

### Critical Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| **Backend Down** | `up == 0` for 1m | Critical |
| **Health Check Failing** | `health_check_status == 0` for 2m | Critical |
| **Ingestion Stalled** | `ingestion_ledgers_processed_total` no increase for 10m | Critical |
| **RPC Errors High** | `rate(rpc_errors_total[5m]) > 0.1` | Critical |

### Warning Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| **High Latency** | `http_request_duration_seconds{p99} > 2s` | Warning |
| **Rate Limit Near** | `rate_limit_remaining / rate_limit_limit < 0.2` | Warning |
| **Reorg Detected** | `increase(ingestion_reorgs_total[5m]) > 0` | Warning |
| **DB Connections High** | `db_connections_active / db_connections_max > 0.8` | Warning |

## Dashboards

### Grafana Dashboard Panels

1. **Request Rate** — `rate(http_requests_total[5m])` by status
2. **Latency** — `histogram_quantile(0.99, http_request_duration_seconds)` by path
3. **Ingestion Progress** — `ingestion_ledgers_processed_total` over time
4. **Event Volume** — `rate(ingestion_events_total[5m])` by type
5. **Error Rate** — `rate(http_requests_total{status=~"5.."}[5m])`
6. **Dependency Health** — RPC latency, DB query latency

## Tracing (Future)

### OpenTelemetry

```javascript
// lib/tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({ endpoint: process.env.JAEGER_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

## Log Aggregation

### Loki (Grafana Stack)

```yaml
# promtail-config.yml
clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: feebumpstudio-backend
    static_configs:
      - targets: [localhost]
        labels:
          job: feebumpstudio-backend
          __path__: /var/log/feebumpstudio/*.log
```

### Elasticsearch

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    paths:
      - /var/log/feebumpstudio/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

## Health Checks

### Endpoint

```
GET /health
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Related Documentation

- [Health Endpoint](../api-reference/health.md)
- [Deployment](../operations/deployment.md)
- [Runbook](../operations/runbook.md)