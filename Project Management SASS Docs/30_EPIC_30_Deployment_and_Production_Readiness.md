# EPIC 30 â Deployment and Production Readiness

## Epic Scope
Everything needed to run the Laravel backend safely in production.

**Explanation:** Backend is not complete until it can be deployed, monitored, backed up, recovered, and operated.

## Feature 30.1 â Environment Configuration

### Tasks
- `APP_ENV=production`
- `APP_DEBUG=false`
- configure database
- configure cache
- configure queue
- configure mail
- configure storage
- configure Sanctum domains
- configure CORS origins
- configure Stripe/webhook secrets

## Feature 30.2 â Laravel Optimization

### Tasks
- `php artisan config:cache`
- `php artisan route:cache`
- `php artisan event:cache`
- `php artisan migrate --force`
- queue worker running
- scheduler running

## Feature 30.3 â Deployment Pipeline

### Tasks
- build backend
- install Composer dependencies without dev packages
- run migrations
- restart queue workers
- clear/rebuild caches
- run smoke tests
- rollback plan

## Feature 30.4 â Backups and Recovery

### Domain Rules
- Database backups must be automatic.
- Recovery must be tested.
- File storage backups must match attachment strategy.

### Tasks
- daily DB backup
- backup retention policy
- restore test
- document recovery steps

## Feature 30.5 â Production Monitoring

### Tasks
- error tracking configured
- logs centralized
- queue failures monitored
- scheduler monitored
- disk usage monitored
- database performance monitored
- uptime checks configured

## Feature 30.6 â Launch Checklist

### Final Checklist
- backend tests pass
- frontend can authenticate with Sanctum
- workspace header works everywhere
- RBAC enforced everywhere
- billing webhook tested
- queue worker deployed
- scheduler deployed
- logs visible
- backups configured
- `APP_DEBUG=false`
- production secrets configured
- health endpoint green

---

# Final Backend Freeze Rule

**Do not freeze backend until these are true:**

1. All 30 epics are either implemented or intentionally marked as postponed.
2. Every postponed epic has a clear reason.
3. All workspace-scoped data is protected by tenant context.
4. Every permission check goes through centralized authorization.
5. Every critical write has audit logging.
6. Every slow side effect is queued.
7. Every list endpoint is paginated.
8. Every critical table has constraints and indexes.
9. Billing and entitlements are connected.
10. Tests prove cross-workspace isolation.
11. Production deployment is documented and repeatable.

**Explanation:** If you skip this freeze rule, you will likely return to backend during frontend development because missing contracts, missing permissions, missing indexes, or missing side effects will appear late.
