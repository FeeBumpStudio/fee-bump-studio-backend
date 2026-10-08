# Operations

## Required production controls

- persistent database backups
- structured logs
- job retry policy
- idempotency keys
- RPC failure handling
- rate limiting
- secret rotation
- alerting

## Stellar data

The service should record transaction hashes, ledger sequence, operation identifiers,
and processing timestamps when those fields are relevant. It should not pretend that
an indexed record is equivalent to a confirmed business outcome until the required
network confirmation rules are satisfied.
