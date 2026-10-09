# Responsible Disclosure

## Reporting Security Vulnerabilities

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately via:

### Primary Channel

**GitHub Security Advisories** (Preferred)
1. Go to [Security tab](https://github.com/FeeBumpStudio/fee-bump-studio-backend/security)
2. Click "Report a vulnerability"
3. Fill in details privately

### Alternative Channel

**Email**: security@feebumpstudio.example.com (if configured)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

| Phase | Target |
|-------|--------|
| **Acknowledgment** | 48 hours |
| **Initial Assessment** | 7 days |
| **Fix Development** | 30 days (critical), 90 days (non-critical) |
| **Disclosure Coordination** | Before public release |

## Scope

### In Scope

- API authentication/authorization flaws
- Injection vulnerabilities (SQL, NoSQL, command)
- Rate limiting bypasses
- Information disclosure via API
- Stellar transaction construction flaws
- RPC request/response handling issues
- Idempotency violations

### Out of Scope

- Stellar protocol vulnerabilities (report to SDF)
- RPC provider vulnerabilities (report to provider)
- Social engineering / phishing
- Denial of service on public endpoints
- Issues requiring physical access

## Safe Harbor

We authorize good-faith research on FeeBumpStudio Backend under these conditions:

- Research only on Testnet or local networks
- No access to user data or private keys
- No disruption of services
- Coordinated disclosure per this policy

## Recognition

Security researchers who report valid vulnerabilities will be:

- Listed in our Security Hall of Fame (with permission)
- Credited in release notes (with permission)
- Eligible for bug bounty (if program exists)

## Contact

**Maintainer**: Jubilee ([@Jubilee-001](https://github.com/Jubilee-001))

For urgent matters, mention `@Jubilee-001` in a private security advisory.