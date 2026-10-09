# Architecture Overview

## High-Level Architecture

```mermaid
flowchart TB
    subgraph App["fee-bump-studio-app"]
        UI[Next.js App]
        SDK[@stellar/stellar-sdk]
    end
    
    subgraph Backend["fee-bump-studio-backend (This Repo)"]
        HTTP[HTTP Server :8080]
        API[API Routes]
        Indexer[Stellar Ingestion]
        DB[(Operational DB)]
    end
    
    subgraph Contracts["fee-bump-studio-contracts"]
        Soroban[Soroban Contract]
        Events[Contract Events]
    end
    
    subgraph Network["Stellar Network"]
        RPC[Soroban RPC]
        Ledger[(Ledger State)]
    end
    
    UI --> SDK
    UI --> HTTP
    SDK --> RPC
    HTTP --> API
    API --> Indexer
    API --> DB
    Indexer --> RPC
    Indexer --> Soroban
    Soroban --> Ledger
    RPC --> Ledger
    Events -.-> Indexer
```

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **No Framework Bloat** | Built-in Node.js `http` module only |
| **Stateless API** | Horizontal scaling ready |
| **Idempotent Ingestion** | Same event → same state |
| **Secrets Server-Side Only** | RPC credentials, DB passwords never in browser |
| **Observability First** | Structured logs, metrics, health checks |

## Component Responsibilities

### HTTP Server (`src/server.js`)

- Request routing
- Health endpoint (`/health`)
- Error handling
- Graceful shutdown

### API Routes (Planned)

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Readiness/liveness probe |
| `GET /api/v1/transactions` | Query indexed transactions |
| `GET /api/v1/contracts/:id/events` | Query contract events |
| `POST /api/v1/operations` | Submit app-initiated operations |

### Indexer (Planned)

- Consume Stellar ledger stream
- Filter relevant transactions/events
- Normalize to application schema
- Store in operational DB
- Handle reorganizations

### Database (Planned)

- PostgreSQL for relational data
- Redis for caching/queues
- Migrations for schema evolution

## Data Flow

### Read Path (App Queries Backend)

```
App → HTTP GET /api/... → API Handler → DB Query → JSON Response
```

### Ingestion Path (Backend Consumes Network)

```
RPC → getLatestLedger → getEvents → Filter → Normalize → DB Upsert → Metrics
```

### Write Path (App Submits via Backend)

```
App → HTTP POST /api/... → Validate → Construct TX → Submit via RPC → Index Result
```

## Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | Node.js 18+ | Native fetch, test runner, long-term support |
| **HTTP** | Built-in `http` | Zero dependencies, full control |
| **Stellar SDK** | @stellar/stellar-sdk 17.2.1 | Official, maintained |
| **Tests** | `node:test` | No external test framework needed |
| **Database** | PostgreSQL (planned) | Relational, ACID, mature ecosystem |

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Trusted)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ HTTP API    │  │ Indexer     │  │ Secrets             │  │
│  │ (Node.js)   │  │ (Ingestion) │  │ (RPC, DB, Keys)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      APP (Untrusted)                        │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ UI          │  │ Stellar SDK │                           │
│  │ (Browser)   │  │ (Browser)   │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Future Architecture Evolution

- **Message Queue** — Redis Streams / RabbitMQ for async processing
- **Worker Processes** — Separate ingestion workers
- **API Gateway** — Rate limiting, auth, routing
- **Event Sourcing** — Full event log for audit
- **Multi-network** — Simultaneous Testnet/Mainnet ingestion