# Adding Endpoints

## Overview

Guide for adding new API endpoints to the FeeBumpStudio Backend.

## Project Structure

```
src/
├── server.js              # Main entry point
├── lib/
│   ├── config.js          # Configuration
│   ├── logger.js          # Logging
│   ├── stellar-client.js  # Stellar RPC client
│   ├── db/                # Database layer (planned)
│   │   ├── pool.js
│   │   ├── events.js
│   │   └── transactions.js
│   ├── indexer/           # Ingestion (planned)
│   │   ├── processor.js
│   │   └── normalizer.js
│   └── api/
│       ├── routes.js      # Route registration
│       ├── middleware/
│       │   ├── cors.js
│       │   ├── rateLimit.js
│       │   └── validate.js
│       ├── handlers/
│       │   ├── health.js
│       │   ├── transactions.js
│       │   ├── events.js
│       │   └── contracts.js
│       └── errors.js      # Error formatting
```

## Adding a New Endpoint

### 1. Create Handler

```javascript
// src/lib/api/handlers/my-endpoint.js
const { validateRequired, validateStellarAddress } = require("../middleware/validate");

async function handleMyEndpoint(req, res, params, query) {
  // 1. Validate input
  const validation = validateRequired(query, ["required_param"]);
  if (!validation.ok) {
    return sendError(res, 400, "validation_failed", validation.errors);
  }
  
  // 2. Business logic
  const result = await doSomething(params.id, query.required_param);
  
  // 3. Send response
  sendJson(res, 200, { data: result });
}

async function doSomething(id, param) {
  // Implementation
  return { id, param, processed: true };
}

module.exports = { handleMyEndpoint };
```

### 2. Register Route

```javascript
// src/lib/api/routes.js
const { handleMyEndpoint } = require("./handlers/my-endpoint");

function registerRoutes(server) {
  server.on("request", async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;
    const query = Object.fromEntries(url.searchParams);
    
    // CORS preflight
    if (req.method === "OPTIONS") {
      return handleCors(req, res);
    }
    
    try {
      // Route matching
      if (path === "/health" && req.method === "GET") {
        return handleHealth(req, res);
      }
      
      if (path === "/api/v1/my-endpoint" && req.method === "GET") {
        return handleMyEndpoint(req, res, {}, query);
      }
      
      // Dynamic routes (e.g., /api/v1/contracts/:id/events)
      const contractMatch = path.match(/^\/api\/v1\/contracts\/([^/]+)\/events$/);
      if (contractMatch && req.method === "GET") {
        return handleContractEvents(req, res, { contractId: contractMatch[1] }, query);
      }
      
      // 404
      sendError(res, 404, "not_found", "Endpoint not found");
    } catch (error) {
      handleError(res, error);
    }
  });
}
```

### 3. Add Validation

```javascript
// src/lib/api/middleware/validate.js
function validateRequired(params, requiredFields) {
  const errors = {};
  for (const field of requiredFields) {
    if (!params[field]) {
      errors[field] = "Required";
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

function validateStellarAddress(address, fieldName = "address") {
  if (!address) return { ok: true };
  // Stellar address regex (G... for accounts, C... for contracts)
  const stellarRegex = /^[GC][A-Z0-9]{55}$/;
  if (!stellarRegex.test(address)) {
    return { ok: false, errors: { [fieldName]: "Invalid Stellar address" } };
  }
  return { ok: true };
}

module.exports = { validateRequired, validateStellarAddress };
```

### 4. Error Handling

```javascript
// src/lib/api/errors.js
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

function sendError(res, status, code, message, details = {}) {
  sendJson(res, status, { error: code, message, details });
}

function handleError(res, error) {
  console.error("Unhandled error:", error);
  
  if (error.code === "VALIDATION_ERROR") {
    return sendError(res, 422, "validation_failed", error.message, error.details);
  }
  
  if (error.code === "NOT_FOUND") {
    return sendError(res, 404, "not_found", error.message);
  }
  
  if (error.code === "UNAUTHORIZED") {
    return sendError(res, 401, "unauthorized", "Authentication required");
  }
  
  if (error.code === "RATE_LIMITED") {
    return sendError(res, 429, "rate_limited", "Too many requests", {
      retryAfter: error.retryAfter,
    });
  }
  
  // Internal error
  sendError(res, 500, "internal_error", "An unexpected error occurred");
}

module.exports = { sendJson, sendError, handleError };
```

## Request/Response Helpers

```javascript
// src/lib/api/helpers.js
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() 
    || req.socket.remoteAddress;
}

module.exports = { parseBody, getClientIp };
```

## Response Standards

### Success Response

```json
{
  "data": { ... },
  "pagination": { ... }  // If applicable
}
```

### Error Response

```json
{
  "error": "error_code",
  "message": "Human-readable description",
  "details": { ... }
}
```

## Testing New Endpoints

```javascript
// test/handlers/my-endpoint.test.js
const test = require("node:test");
const assert = require("node:assert");
const { handleMyEndpoint } = require("../../src/lib/api/handlers/my-endpoint");

test("handleMyEndpoint returns processed result", async () => {
  const req = { method: "GET" };
  const res = createMockResponse();
  
  await handleMyEndpoint(req, res, {}, { required_param: "test" });
  
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body, { data: { id: undefined, param: "test", processed: true } });
});

function createMockResponse() {
  const chunks = [];
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(data) { chunks.push(data); this.body = JSON.parse(Buffer.concat(chunks).toString()); },
  };
}
```

## Documentation

Update API reference:

1. Add endpoint to [HTTP API](../api-reference/http-api.md)
2. Include request/response examples
3. Document query parameters
4. Add error codes

## Checklist

- [ ] Handler created in `src/lib/api/handlers/`
- [ ] Route registered in `src/lib/api/routes.js`
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Tests written
- [ ] API documentation updated
- [ ] OpenAPI spec updated (if applicable)

## Related Documentation

- [Architecture - Components](../architecture/components.md)
- [HTTP API Reference](../api-reference/http-api.md)
- [Testing](../development/testing.md)