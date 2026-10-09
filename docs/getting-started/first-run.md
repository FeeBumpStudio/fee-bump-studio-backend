# First Run

## Start the Server

```bash
npm run dev
# or
npm start
```

Output:

```text
> fee-bump-studio-backend@0.1.0 dev
> node src/server.js

listening on 8080
```

## Verify Health Endpoint

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{"ok":true}
```

## Test 404 Handling

```bash
curl http://localhost:8080/nope
```

Expected response:

```json
{"error":"not_found"}
```

## Verify Network Configuration

Check the console for network configuration:

```text
listening on 8080
Network: testnet
RPC: https://soroban-testnet.stellar.org
Contract: CABC... (if configured)
```

## Common First-Run Issues

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Set `PORT=8081` in `.env` or kill the process on 8080 |
| RPC connection failed | Verify `STELLAR_RPC_URL` is accessible; try the public Testnet default |
| Contract not found | Ensure `STELLAR_CONTRACT_ID` matches a deployed contract on the target network |
| EADDRINUSE error | Another process is using the port; change `PORT` or stop the other process |

## Next Steps

- Explore the [Architecture Overview](../architecture/overview.md)
- Read [API Reference](../api-reference/http-api.md)
- Check [Operations - Deployment](../operations/deployment.md)