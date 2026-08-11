# EPIC 22 â Background Jobs and Queue Reliability

## Epic Scope
Reliable asynchronous work, retries, backoff, idempotency, and failed job handling.

**Explanation:** Queues move slow or unreliable work out of the request path. Jobs must be safe to retry because failures and duplicates happen in production.

## Feature 22.1 â Queue Infrastructure

### Services / Actions Used
- **Service:** `QueueHealthService`
- **Jobs:** all async jobs

### Domain Rules
- Slow work should leave request-response path.
- Failed jobs must be observable.
- Queue driver should be production-ready.

### Tasks
- Configure queue driver.
- Configure failed jobs table.
- Configure retry/backoff.
- Add queue worker deployment instructions.
- Optional: Laravel Horizon if Redis is used.

## Feature 22.2 â Idempotent Jobs

### Domain Rules
- Re-running the same job must not create duplicate side effects.

### Jobs to Review
- `SendInviteEmail`
- `SendMentionNotification`
- `GenerateTaskExport`
- `ProcessTaskImport`
- `DeliverWebhook`
- `PurgeSoftDeletedRecords`
- `HandleBillingWebhook`

### Tasks
- Add idempotency keys where needed.
- Use unique jobs where appropriate.
- Check existing records before creating side effects.

## Feature 22.3 â Failed Job Operations

### Tasks
- Monitor failed jobs.
- Retry failed jobs safely.
- Log job failure context.
- Alert on repeated failures.

---
