# Runbook

## Overview

This runbook covers common operational scenarios for the FeeBumpStudio Backend.

## Incidents

### Backend Not Responding

**Symptoms**: Health endpoint returns 5xx or times out

**Diagnosis**:
```bash
# Check if process is running
ps aux | grep "node src/server.js"

# Check logs
docker logs feebump-backend --tail 100
# or
journalctl -u feebumpstudio-backend -n 100

# Check port binding
netstat -tlnp | grep 8080
```

**Resolution**:
1. Restart service: `systemctl restart feebumpstudio-backend` or `docker restart feebump-backend`
2. Check for OOM kills: `dmesg | grep -i kill`
3. Verify environment variables loaded correctly
4. Check dependency connectivity (RPC, DB)

### Ingestion Stalled

**Symptoms**: No new events in database, ledger checkpoint not advancing

**Diagnosis**:
```bash
# Check current checkpoint
psql -c "SELECT * FROM checkpoints WHERE name = 'ingestion';"

# Check latest ledger on network
curl -X POST https://soroban-testnet.stellar.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger"}'

# Check ingestion logs
grep "ingestion" /var/log/feebumpstudio/*.log | tail -20
```

**Resolution**:
1. Verify RPC connectivity
2. Check for reorg handling (see below)
3. Restart ingestion worker
4. If stuck on specific ledger, investigate that ledger's events

### Reorganization Detected

**Symptoms**: Checkpoint > latest ledger, warnings in logs

**Diagnosis**:
```bash
# Check checkpoint vs network
psql -c "SELECT * FROM checkpoints;"
curl -X POST $RPC_URL -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger"}'
```

**Resolution**:
1. System auto-recovers on next poll cycle
2. Verify orphaned events cleaned up:
   ```sql
   SELECT count(*) FROM events WHERE ledger > (SELECT ledger FROM checkpoints WHERE name = 'ingestion');
   ```
3. Monitor for repeated reorgs (may indicate RPC issues)

### High RPC Error Rate

**Symptoms**: Increased 5xx from RPC, ingestion latency spikes

**Diagnosis**:
```bash
# Check RPC health
curl -X POST $RPC_URL -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check rate limit headers
curl -v -X POST $RPC_URL -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger"}' 2>&1 | grep -i ratelimit
```

**Resolution**:
1. Implement exponential backoff in ingestion
2. Upgrade RPC plan if rate limited
3. Switch to backup RPC endpoint
4. Alert provider if their infrastructure issue

### Database Connection Exhaustion

**Symptoms**: "Too many connections", query timeouts

**Diagnosis**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check pool usage
SELECT * FROM pg_stat_database WHERE datname = 'feebumpstudio';
```

**Resolution**:
1. Increase `DB_POOL_SIZE` if resources allow
2. Check for connection leaks (long-running transactions)
3. Add PgBouncer for connection pooling
4. Optimize slow queries

## Maintenance

### Scheduled Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| **Log rotation** | Daily | `logrotate /etc/logrotate.d/feebumpstudio` |
| **Database vacuum** | Weekly | `psql -c "VACUUM ANALYZE;"` |
| **Certificate renewal** | 60 days | `certbot renew` |
| **Dependency updates** | Monthly | `npm audit && npm update` |

### Database Maintenance

```bash
# Analyze table statistics
psql -c "ANALYZE events; ANALYZE transactions;"

# Check index usage
psql -c "
  SELECT schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan;
"

# Check table sizes
psql -c "
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Log Cleanup

```bash
# Keep 30 days of application logs
find /var/log/feebumpstudio -name "*.log" -mtime +30 -delete

# Compress old logs
find /var/log/feebumpstudio -name "*.log" -mtime +1 -exec gzip {} \;
```

## Recovery Procedures

### Full Restore from Backup

1. **Stop service**: `systemctl stop feebumpstudio-backend`
2. **Restore database**: `pg_restore -d feebumpstudio backup.dump`
3. **Restore checkpoints**: Verify `checkpoints` table has correct ledger
4. **Start service**: `systemctl start feebumpstudio-backend`
5. **Verify ingestion**: Check logs for normal processing

### Point-in-Time Recovery

```bash
# Using WAL archiving
pg_basebackup -D /restore -Ft -z -P
# Restore WAL files to target timestamp
# Start PostgreSQL with recovery.target_time
```

### Contract Re-deployment

If contract needs upgrade (future):
1. Deploy new contract version
2. Update `STELLAR_CONTRACT_ID` in environment
3. Restart backend to pick up new contract
4. Verify ingestion works with new contract

## Contact Information

| Role | Contact |
|------|---------|
| **Primary On-call** | Jubilee (@Jubilee-001) |
| **RPC Provider** | Provider support channel |
| **Database** | DBA team / managed service support |

## Related Documentation

- [Monitoring](../operations/monitoring.md)
- [Deployment](../operations/deployment.md)
- [Scaling](../operations/scaling.md)