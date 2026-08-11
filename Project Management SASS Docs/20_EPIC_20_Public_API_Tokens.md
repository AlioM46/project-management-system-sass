# EPIC 20 â Public API Tokens

## Epic Scope
External API access through scoped tokens.

**Explanation:** Sanctum SPA cookies are for your frontend. API tokens are for integrations, scripts, or external clients. Keep these concerns separate.

## Feature 20.1 â Workspace API Tokens

### Services / Actions Used
- **Action:** `CreateApiToken`
- **Action:** `RevokeApiToken`
- **Service:** `ApiTokenService`

### Domain Rules
- Token belongs to workspace.
- Token has abilities/scopes.
- Token should be hashed at rest.
- Token can be revoked.
- Token usage should be audited.

### Tasks
- **DB**
  - use Sanctum tokens or custom table
  - store workspace_id
  - name
  - abilities
  - last_used_at
  - expires_at nullable
- **API**
  - `GET /api-tokens`
  - `POST /api-tokens`
  - `DELETE /api-tokens/{id}`
- **Tests**
  - token created
  - token can access allowed endpoint
  - token denied for missing scope
  - revoked token fails

## Feature 20.2 â Token Rate Limiting

### Domain Rules
- API tokens should have rate limits.
- Limits may vary by plan.

### Tasks
- Add token-specific rate limiter.
- Audit suspicious usage.

---
