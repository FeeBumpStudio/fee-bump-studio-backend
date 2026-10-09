# Local Development

## Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. In another terminal, run tests
npm test

# 3. Make changes to src/

# 4. Verify tests pass
npm test
```

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `node src/server.js` | Start dev server |
| `start` | `node src/server.js` | Start production server |
| `test` | `node --test` | Run test suite |

## Development Server

- **URL**: `http://localhost:8080` (or `PORT` from `.env`)
- **Auto-reload**: Not available (plain Node.js) — restart manually
- **Logs**: Structured JSON to stdout

## Environment Setup

### Required `.env`

```bash
cp .env.example .env
# Edit .env with your Testnet config
```

```ini
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_CONTRACT_ID=CABC...YOUR_TESTNET_CONTRACT
PORT=8080
```

### Optional Development Tools

```bash
# Install Stellar CLI for contract development
cargo install --locked stellar-cli
```

## Code Style

### JavaScript

- **ES Modules** — Use `import`/`export` (add `"type": "module"` to package.json if needed)
- **Async/await** — Prefer over callbacks
- **Error handling** — Always handle promise rejections
- **Constants** — Use `const` by default, `let` when reassignment needed

### Stellar SDK Usage

```javascript
// Good: Explicit configuration
const { rpc, Config, Networks, BASE_FEE } = require("@stellar/stellar-sdk");

Config.setDefault({ networkPassphrase: Networks.TESTNET });

const server = new rpc.Server(process.env.STELLAR_RPC_URL, {
  allowHttp: false,
});

// Good: Proper error handling
async function getLatestLedgerSafe() {
  try {
    return await server.getLatestLedger();
  } catch (error) {
    logger.error("Failed to get latest ledger", error);
    throw error; // Re-throw for caller to handle
  }
}
```

## Debugging

### Console Logs

```javascript
// Enable debug logging
const { Config } = require("@stellar/stellar-sdk");
Config.setLogLevel("debug");
```

### Common Debug Scenarios

| Issue | Debug Approach |
|-------|----------------|
| RPC timeout | Check network tab, try different RPC |
| Contract error | Use `simulateTransaction` first |
| Event not indexed | Check ingestion logs, verify contract ID |
| Health check failing | Verify dependencies (RPC, DB) |

### Manual RPC Testing

```bash
# Test RPC health
curl -X POST https://soroban-testnet.stellar.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Get latest ledger
curl -X POST https://soroban-testnet.stellar.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger"}'

# Get events for ledger range
curl -X POST https://soroban-testnet.stellar.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getEvents","params":{"startLedger":12345000,"endLedger":12345100,"filters":[{"type":"contract","contractIds":["CABC..."]}]}}'
```

## Testing

### Current Test Suite

```bash
npm test
```

Tests cover:
- Server starts and binds to port
- Health endpoint returns 200 OK
- Unknown routes return 404

### Adding Tests

Create `test/*.test.js` files:

```javascript
// test/new-feature.test.js
const test = require("node:test");
const assert = require("node:assert");

test("feature works correctly", async () => {
  // Test implementation
  assert.strictEqual(actual, expected);
});
```

### Test Patterns

| Pattern | Example |
|---------|---------|
| **Unit test** | Pure function input/output |
| **Integration test** | HTTP request → response |
| **Contract test** | Simulate → verify result |

## Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes, commit
git add .
git commit -m "feat: your feature description"

# 3. Push and open PR
git push origin feature/your-feature
```

## Pre-commit Checks (Recommended)

```bash
# Install husky
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## Useful Commands

```bash
# Check for unused dependencies
npx depcheck

# Audit dependencies
npm audit

# Update dependencies
npm update

# Format code (if Prettier added)
npx prettier --write .
```

## Related Documentation

- [Testing](testing.md)
- [Adding Endpoints](adding-endpoints.md)
- [Contributing](contributing.md)
- [Architecture - Components](../architecture/components.md)