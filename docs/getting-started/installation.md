# Installation

## Clone the Repository

```bash
git clone https://github.com/FeeBumpStudio/fee-bump-studio-backend.git
cd fee-bump-studio-backend
```

## Install Dependencies

```bash
npm install
```

This installs production dependencies:

```json
{
  "dependencies": {
    "@stellar/stellar-sdk": "17.2.1"
  }
}
```

No development dependencies are currently required.

## Verify Installation

Run the test suite to verify the setup:

```bash
npm test
```

Expected output:

```text
> fee-bump-studio-backend@0.1.0 test
> node --test

✔ module loads and boots an HTTP server
✔ health endpoint responds ok
✔ unknown routes return 404 not_found
ℹ tests 3
ℹ pass 3
```

## Next Steps

- [Configuration](configuration.md) — Set up environment variables
- [First Run](first-run.md) — Start the development server
- [Architecture Overview](../architecture/overview.md) — Understand the system design