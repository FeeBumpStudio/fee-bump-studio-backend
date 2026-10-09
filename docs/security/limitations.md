# Known Limitations

## Current Baseline Limitations

### Functionality

| Limitation | Impact | Planned Resolution |
|------------|--------|-------------------|
| **Health endpoint only** | No real API yet | Implement full REST API |
| **No ingestion** | No indexed data | Build indexer pipeline |
| **No database** | No persistence | Add PostgreSQL + Redis |
| **No authentication** | Open API | Add API key / JWT auth |
| **No rate limiting** | DoS risk | Implement token bucket |
| **No monitoring** | No visibility | Add metrics + logging |

### Technical

| Limitation | Impact | Planned Resolution |
|------------|--------|-------------------|
| **No tests for new features** | Regression risk | Add test coverage |
| **No linting** | Inconsistent style | Add ESLint |
| **No CI/CD for deploy** | Manual deployment | GitHub Actions → K8s/Docker |
| **Single process** | No HA | Multiple replicas |
| **No graceful shutdown** | Connection drops | SIGTERM handling |
| **No request validation** | Bad input crashes | Schema validation |

### Security

| Limitation | Impact | Planned Resolution |
|------------|--------|-------------------|
| **No authentication** | Open access | API keys / JWT |
| **No rate limiting** | DoS risk | Redis token bucket |
| **No audit logging** | No trail | Structured audit logs |
| **No input validation** | Injection risk | Zod/Ajv schemas |
| **No CSP/headers** | XSS risk | Helmet.js equivalent |
| **No dependency scanning** | Supply chain | `npm audit` in CI |

### Operational

| Limitation | Impact | Planned Resolution |
|------------|--------|-------------------|
| **No backup strategy** | Data loss risk | Document procedures |
| **No runbook** | Slow incident response | Create runbook |
| **No capacity planning** | Scaling surprises | Document triggers |
| **Single maintainer** | Bus factor | Grow contributor base |

## Architecture Limitations

### Scalability

| Area | Current | Limit | Future |
|------|---------|-------|--------|
| **Concurrent requests** | 1 process | ~1000 req/s | Horizontal scaling |
| **Ingestion throughput** | 1 writer | ~50 ledgers/s | Sharded ingestion |
| **Database connections** | Direct | Pool exhaustion | PgBouncer |
| **RPC calls** | Direct | Rate limited | Proxy + cache |

### Maintainability

| Area | Current | Risk |
|------|---------|------|
| **Code organization** | Single file | Growing complexity |
| **Type safety** | JSDoc only | Runtime errors possible |
| **Dependency updates** | Manual | Security drift |

## Network-Specific Limitations

### Testnet

- **Rate limits** — 100 req/min on public RPC
- **Ledger reset** — Periodic; data wiped
- **No SLA** — Not for production workloads

### Mainnet (Future)

- **Cost** — Real XLM for operations
- **Finality** — ~5s ledger close; wait for confirmations
- **Regulatory** — Consider jurisdiction requirements

## Dependency Risks

| Dependency | Risk | Mitigation |
|------------|------|------------|
| `@stellar/stellar-sdk` | Breaking changes | Pin version; test upgrades |
| `node` | Major version changes | Lock major; planned upgrades |
| RPC provider | Service changes | Multi-provider abstraction |

## Upgrade Path

### From Baseline to Production

```
v0.1.0 (baseline)
    │
    ├─► v0.2.0: Full REST API + validation
    │
    ├─► v0.3.0: Ingestion pipeline + PostgreSQL
    │
    ├─► v0.4.0: Authentication + rate limiting
    │
    ├─► v0.5.0: Monitoring + alerting + logging
    │
    ├─► v0.6.0: Tests + CI/CD + deployment
    │
    ├─► v0.7.0: Security hardening + audit prep
    │
    └─► v1.0.0: Production release (post-audit)
```

## Acceptable Use

This baseline is **only suitable for**:

- Local development and testing
- Testnet experimentation
- Architecture evaluation
- Contributor onboarding

**Not suitable for**:

- Mainnet funds
- Production workloads
- User-facing demos without disclaimers
- Compliance-required environments

## Related Documentation

- [Roadmap](https://github.com/FeeBumpStudio/fee-bump-studio-backend/blob/main/README.md#roadmap)
- [Security Assumptions](assumptions.md)
- [Responsible Disclosure](responsible-disclosure.md)
- [Architecture](../architecture/overview.md)