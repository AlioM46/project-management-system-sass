# EPIC 23 â Security Hardening

## Epic Scope
Final security layer across the entire backend.

**Explanation:** Auth and RBAC are not enough. Production SaaS also needs CSRF, CORS, rate limits, safe errors, secure cookies, mass-assignment protection, and sensitive data hiding.

## Feature 23.1 â Request Security

### Domain Rules
- SPA requests use Sanctum CSRF flow.
- CORS must allow credentials only from trusted origins.
- Cookies must be secure in production.

### Tasks
- Verify `SANCTUM_STATEFUL_DOMAINS`.
- Verify CORS origins.
- Verify SameSite/Secure cookie settings.
- Add rate limits for sensitive endpoints.

## Feature 23.2 â Data Exposure Protection

### Domain Rules
- Never expose passwords, tokens, secrets, or internal IDs unnecessarily.
- Use API resources for responses.

### Tasks
- Hide sensitive model attributes.
- Use response resources.
- Review all JSON responses.

## Feature 23.3 â Error Safety

### Domain Rules
- Production must not expose stack traces.
- Domain errors should use stable error codes.

### Tasks
- Set `APP_DEBUG=false` in production.
- Standardize error responses.
- Log internal details server-side only.

## Feature 23.4 â Rate Limiting

### Endpoints to Limit
- login
- register
- forgot password
- invite creation
- comments
- file uploads
- API token endpoints
- webhooks if applicable

### Tests
- rate limit returns `429`

---
