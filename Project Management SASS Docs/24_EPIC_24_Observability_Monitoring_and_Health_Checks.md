# EPIC 24 â Observability, Monitoring, and Health Checks

## Epic Scope
Logging, metrics, health checks, and production visibility.

**Explanation:** If production breaks, you need to know what failed, where, for which workspace, and how severe it is.

## Feature 24.1 â Structured Logging

### Services / Actions Used
- **Service:** `LoggingContextService`

### Domain Rules
- Logs should include request context.
- Sensitive data must not be logged.

### Log Context
- request_id
- workspace_id
- actor_user_id
- route
- status_code
- duration_ms

### Tasks
- Add request ID middleware.
- Add workspace/user context to logs.
- Configure production log channel.

## Feature 24.2 â Health Checks

### Services / Actions Used
- **Service:** `HealthCheckService`

### Domain Rules
- Health endpoints should be safe and minimal.
- Do not expose secrets.

### API
- `GET /health`
- `GET /health/database`
- `GET /health/queue`
- `GET /health/cache`

### Tests
- health endpoint returns ok
- database failure reflected safely

## Feature 24.3 â Error Tracking

### Tasks
- Integrate Sentry, Bugsnag, Flare, or similar.
- Send exceptions with request context.
- Scrub sensitive fields.

---
