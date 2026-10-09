# Security Assumptions

## Threat Model

### Assumptions

| Assumption | Justification |
|------------|---------------|
| **RPC endpoint is trusted** | TLS + known provider; MITM would require CA compromise |
| **Database is trusted** | Internal network, authenticated access |
| **Contract code is as deployed** | Immutable baseline; verify via source verification |
| **Server environment is secure** | Standard server hardening practices |
| **Network (Testnet/Mainnet) operates correctly** | Byzantine fault tolerance of Stellar consensus |

### Trust Boundaries

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
                          │ RPC/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      STELLAR NETWORK                        │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ RPC Node    │  │ Ledger      │                           │
│  │ (Trusted*)  │  │ (Consensus) │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

* RPC trust assumes correct configuration and reputable provider

## Security Properties

### Confidentiality

- **Secrets**: Server-only (RPC auth, DB credentials, API keys)
- **User data**: Minimal; no PII collected
- **Transaction data**: Public on ledger; no private info

### Integrity

- **Ingestion**: Idempotent upserts; reorg handling
- **API**: Input validation; structured error responses
- **Database**: ACID transactions; foreign keys

### Availability

- **API**: Stateless; horizontal scaling
- **Ingestion**: Single writer; checkpoint recovery
- **Dependencies**: Circuit breakers; graceful degradation

## Attack Surface Analysis

### HTTP API

| Vector | Mitigation |
|--------|------------|
| Injection (SQL/NoSQL) | Parameterized queries; validation |
| Rate limiting bypass | Redis-backed token bucket |
| Information disclosure | Structured errors; no stack traces in prod |
| DoS | Rate limits; request size limits; timeouts |

### Ingestion Pipeline

| Vector | Mitigation |
|--------|------------|
| Duplicate events | Idempotent upserts on event ID |
| Reorg corruption | Checkpoint rollback + reprocess |
| RPC manipulation | Simulation verifies results |
| Checkpoint tampering | DB constraints; audit log |

### Database

| Vector | Mitigation |
|--------|------------|
| SQL injection | Parameterized queries only |
| Credential theft | Secret manager; rotation |
| Data tampering | Append-only events; reconciliation |
| DoS | Connection pooling; query timeouts |

### Stellar Integration

| Vector | Mitigation |
|--------|------------|
| Fee manipulation | User sees fee before signing (app layer) |
| RPC MITM | TLS + certificate validation |
| Contract upgrade attack | Immutable baseline |
| Replay protection | Network passphrase + sequence numbers |

## Cryptographic Assumptions

| Primitive | Algorithm | Source |
|-----------|-----------|--------|
| TLS | X25519 + AES-GCM | Node.js / OpenSSL |
| Stellar signatures | Ed25519 | Stellar SDK |
| Hashing | SHA-256 | Stellar SDK / Node.js crypto |
| API keys | PBKDF2 / bcrypt | Node.js crypto |

## Compliance Considerations

| Regulation | Applicability | Approach |
|------------|---------------|----------|
| GDPR | No PII collected | N/A |
| SOC2 | Not certified | Document controls |
| PCI DSS | No payments | N/A |

## Future Hardening

- [ ] Request/response schema validation (Zod/Ajv)
- [ ] API authentication (API keys / JWT)
- [ ] Audit logging for all mutations
- [ ] Certificate pinning for RPC
- [ ] Formal verification of ingestion logic
- [ ] Penetration testing before Mainnet

## Related Documentation

- [Responsible Disclosure](responsible-disclosure.md)
- [Known Limitations](limitations.md)
- [Architecture - Security Boundaries](../architecture/overview.md#security-boundaries)