# Testing

## Current Test Status

The baseline repository has a minimal test suite using Node.js built-in test runner:

```bash
npm test
```

Output:
```text
> fee-bump-studio-backend@0.1.0 test
> node --test

✔ module loads and boots an HTTP server
✔ health endpoint responds ok
✔ unknown routes return 404 not_found
ℹ tests 3
ℹ pass 3
```

## Test Structure

```
test/
├── server.test.js          # Current tests
└── *.test.js               # Future tests
```

## Test Patterns

### Server Integration Tests

```javascript
// test/server.test.js
const test = require("node:test");
const assert = require("node:assert");
const { spawn } = require("node:child_process");

test("health endpoint responds ok", async () => {
  const child = spawn(process.execPath, ["src/server.js"], {
    env: { ...process.env, PORT: "18321" },
  });
  
  try {
    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("timeout")), 5000);
      child.stdout.on("data", () => { clearTimeout(timeout); resolve(); });
      child.on("exit", (code) => reject(new Error(`exited ${code}`)));
    });
    
    const res = await fetch("http://localhost:18321/health");
    const body = await res.json();
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.ok, true);
  } finally {
    child.kill();
  }
});
```

### Unit Tests (Planned)

```javascript
// test/utils/normalize-event.test.js
const test = require("node:test");
const assert = require("node:assert");
const { normalizeContractEvent } = require("../../src/lib/normalizer");

test("normalizes contract event correctly", () => {
  const rpcEvent = { /* mock RPC event */ };
  const normalized = normalizeContractEvent(rpcEvent);
  
  assert.strictEqual(normalized.type, "contract");
  assert.ok(normalized.id);
  assert.ok(normalized.timestamp instanceof Date);
});
```

### Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| `@stellar/stellar-sdk` | Mock RPC server responses |
| `fetch` | `undici` or `fetch-mock` |
| Database | In-memory SQLite or test containers |
| Redis | `ioredis-mock` |

### Test Utilities

```javascript
// test/helpers.js
async function withTestServer(port, fn) {
  const child = spawn(process.execPath, ["src/server.js"], {
    env: { ...process.env, PORT: String(port) },
  });
  
  await waitForServer(port);
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    child.kill();
  }
}

function waitForServer(port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server start timeout")), timeout);
    const check = () => fetch(`http://localhost:${port}/health`)
      .then(() => { clearTimeout(timer); resolve(); })
      .catch(() => setTimeout(check, 100));
    check();
  }
}
```

## Running Tests

```bash
# All tests
npm test

# Single test file
node --test test/server.test.js

# With verbose output
node --test --test-reporter=spec test/

# Watch mode (requires custom script)
node --test --watch test/
```

## CI Integration

```yaml
# .github/workflows/ci.yml
- name: Test
  run: npm test
```

## Coverage (Future)

```bash
# When using c8 or similar
npm install --save-dev c8
npx c8 node --test
```

## Related Documentation

- [Local Development](local-development.md)
- [Adding Endpoints](adding-endpoints.md)
- [CI Workflow](../configuration/ci-cd.md)