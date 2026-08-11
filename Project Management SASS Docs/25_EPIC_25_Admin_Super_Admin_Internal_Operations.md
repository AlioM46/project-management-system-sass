# EPIC 25 â Admin / Super Admin / Internal Operations

## Epic Scope
Internal platform operations for managing customers, users, and support cases.

**Explanation:** Workspace admins manage their workspace. Super admins manage the SaaS platform. Keep these permission systems separate.

## Feature 25.1 â Super Admin Access

### Services / Actions Used
- **Service:** `SuperAdminAuthorizationService`

### Domain Rules
- Super admin is global, not workspace role.
- Must be heavily protected.
- All super admin actions must be audited.

### Tasks
- Add super admin flag or separate admin table.
- Protect admin routes.
- Add audit events.

## Feature 25.2 â Workspace Operations

### API
- `GET /admin/workspaces`
- `GET /admin/workspaces/{id}`
- `POST /admin/workspaces/{id}/suspend`
- `POST /admin/workspaces/{id}/reactivate`

### Domain Rules
- Suspend blocks workspace access according to business rule.
- Reactivate restores access.

## Feature 25.3 â User Operations

### API
- `GET /admin/users`
- `GET /admin/users/{id}`

### Optional Dangerous Feature
- impersonation

### Impersonation Rules
- Must be audited.
- Must be time-limited.
- Must show visible banner.
- Must never expose passwords/payment secrets.

---
