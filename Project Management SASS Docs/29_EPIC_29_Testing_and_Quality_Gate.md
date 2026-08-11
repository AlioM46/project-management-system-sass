# EPIC 29 â Testing and Quality Gate

## Epic Scope
Feature, unit, integration, authorization, database, queue, and regression tests.

**Explanation:** Tests are the proof that backend behavior is safe to freeze. Without tests, you will return to backend later because frontend will reveal hidden problems.

## Feature 29.1 â Feature Test Coverage

### Must Test
- authentication
- workspace context
- RBAC
- projects
- tasks
- workflow
- comments
- mentions
- notifications
- audit logs
- reports
- billing
- entitlements
- files
- exports

### Critical Tests
- workspace A user cannot access workspace B data
- missing `X-Workspace-Id` returns `400`
- non-member returns `403`
- missing permission returns `403`
- every critical write creates audit log
- workflow update + history is atomic
- billing webhook is idempotent

## Feature 29.2 â Unit Tests

### Test Services
- `AuthorizationService`
- `WorkspaceContextService`
- `WorkflowService`
- `MentionParser`
- `EntitlementService`
- `RetentionService`
- `AuditLogger`

## Feature 29.3 â Job Tests

### Test Jobs
- email jobs
- notification jobs
- export jobs
- import jobs
- webhook delivery jobs
- retention purge job

### Domain Rules
- Jobs should be retry-safe.
- Jobs should not duplicate side effects.

## Feature 29.4 â Backend Freeze Checklist

### Tasks
- Run full test suite.
- Run static analysis if used.
- Run coding standard tool.
- Run fresh migration.
- Run seeders.
- Run API smoke tests in Postman.

---
