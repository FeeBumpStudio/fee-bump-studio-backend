# HTTP API Reference

## Base URL

```
Development: http://localhost:8080
Production:  https://api.feebumpstudio.example.com
```

## Endpoints

### Health Check

```
GET /health
```

**Response (200 OK)**

```json
{
  "ok": true
}
```

**Response (503 Service Unavailable)** — If dependencies unhealthy

```json
{
  "ok": false,
  "checks": {
    "rpc": { "ok": false, "error": "connection refused" },
    "db": { "ok": true },
    "contract": { "ok": true }
  }
}
```

### List Transactions (Planned)

```
GET /api/v1/transactions
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page (max 200) |
| `status` | string | — | Filter: `pending`, `success`, `failed` |
| `type` | string | — | Filter: `fee_bump`, `contract_call` |
| `from` | date | — | Start date (ISO 8601) |
| `to` | date | — | End date (ISO 8601) |
| `sort` | string | `-created_at` | Sort field (`-` for desc) |

**Response (200 OK)**

```json
{
  "data": [
    {
      "id": "a1b2c3d4...",
      "type": "fee_bump",
      "status": "success",
      "source_account": "GABC...",
      "fee": "2000000",
      "ledger": 12345678,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:05Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "pages": 3
  }
}
```

### Get Transaction (Planned)

```
GET /api/v1/transactions/:id
```

**Response (200 OK)**

```json
{
  "id": "a1b2c3d4...",
  "type": "fee_bump",
  "status": "success",
  "source_account": "GABC...",
  "fee_source": "GBDE...",
  "fee": "2000000",
  "inner_fee": "1000000",
  "ledger": 12345678,
  "result": {
    "success": true,
    "events": [...]
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:05Z"
}
```

### List Contract Events (Planned)

```
GET /api/v1/contracts/:contractId/events
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page (max 200) |
| `type` | string | — | Filter: `contract`, `diagnostic` |
| `topic` | string | — | Filter by event topic |
| `from_ledger` | integer | — | Start ledger |
| `to_ledger` | integer | — | End ledger |

**Response (200 OK)**

```json
{
  "data": [
    {
      "id": "12345678-0",
      "ledger": 12345678,
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "contract",
      "contract_id": "CABC...",
      "topics": ["fee_bump_recorded", "GABC..."],
      "data": { "reference": "TX-abc-001", "actor": "GABC..." },
      "transaction_hash": "a1b2c3d4..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 89,
    "pages": 2
  }
}
```

### Submit Operation (Planned)

```
POST /api/v1/operations
```

**Request Body**

```json
{
  "type": "fee_bump",
  "inner_transaction_xdr": "AAAA...",
  "fee_source": "GABC...",
  "replacement_fee": "2000000"
}
```

**Response (202 Accepted)**

```json
{
  "id": "a1b2c3d4...",
  "status": "pending",
  "message": "Operation queued for processing"
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": "error_code",
  "message": "Human-readable description",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `not_found` | 404 | Resource not found |
| `invalid_request` | 400 | Malformed request |
| `validation_failed` | 422 | Request validation failed |
| `unauthorized` | 401 | Authentication required |
| `rate_limited` | 429 | Too many requests |
| `internal_error` | 500 | Server error |
| `service_unavailable` | 503 | Dependencies unhealthy |

### Validation Error Details

```json
{
  "error": "validation_failed",
  "message": "Request validation failed",
  "details": {
    "fields": {
      "fee_source": "Invalid Stellar address",
      "replacement_fee": "Must be a positive integer"
    }
  }
}
```

## Rate Limiting

| Tier | Requests/Minute | Burst |
|------|-----------------|-------|
| Anonymous | 60 | 10 |
| Authenticated | 300 | 50 |
| Admin | 1000 | 200 |

Headers:
- `X-RateLimit-Limit` — Limit
- `X-RateLimit-Remaining` — Remaining
- `X-RateLimit-Reset` — Unix timestamp

## Authentication (Planned)

### API Key

```
Authorization: Bearer sk_live_abc123...
```

### Scopes

| Scope | Endpoints |
|-------|-----------|
| `read:transactions` | GET /api/v1/transactions |
| `read:events` | GET /api/v1/contracts/:id/events |
| `write:operations` | POST /api/v1/operations |

## Versioning

- **URL versioning**: `/api/v1/`
- **Breaking changes** → New version (`v2`)
- **Deprecation** — 3 months notice via headers

## Related Documentation

- [Health Endpoint](health.md)
- [Stellar Ingestion](stellar-ingestion.md)
- [Architecture - Components](../architecture/components.md)