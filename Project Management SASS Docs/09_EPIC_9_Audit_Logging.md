# EPIC 9 â Audit Logging

## Epic Scope
Centralized audit trail for security-sensitive and business-critical changes.

**Explanation:** Audit logging answers: who changed what, when, from what value, to what value, and inside which workspace. It is mandatory for accountability in a SaaS.

## Feature 9.1 â Audit Engine

### User Story
As the system, I want all sensitive changes logged so admins can review activity.

### Services / Actions Used
- **Service:** `AuditLogger`

### Domain Rules
- All security-sensitive changes must log.
- Must store before/after values when applicable.
- Must include actor and workspace.
- Audit logging must be centralized.
- Controllers must not manually build audit payloads.

### Tasks
- **DB**
  - `audit_logs`:
    - id
    - workspace_id
    - actor_user_id nullable
    - event_type
    - auditable_type nullable
    - auditable_id nullable
    - old_values JSON nullable
    - new_values JSON nullable
    - metadata JSON nullable
    - ip_address nullable
    - user_agent nullable
    - created_at
- **API**
  - `GET /audit-logs`
  - `GET /audit-logs/{id}`
- **Filters**
  - event_type
  - actor_user_id
  - auditable_type
  - date_from
  - date_to
- **Implementation**
  - `AuditLogger::log(...)`
  - `AuditLogger::logModelChange(...)`
  - `AuditLogger::logSecurityEvent(...)`
- **Tests**
  - role update creates audit log
  - permission sync creates audit log
  - task delete creates audit log
  - audit logs are workspace-scoped

## Feature 9.2 â Audit Event Catalog

### Domain Rules
Audit events should use stable string keys.

### Suggested Events
- `workspace.created`
- `workspace.settings_updated`
- `member.invited`
- `member.joined`
- `member.role_changed`
- `member.removed`
- `role.created`
- `role.updated`
- `role.deleted`
- `role.permissions_synced`
- `project.deleted`
- `project.restored`
- `task.deleted`
- `task.status_changed`
- `task.assignee_added`
- `task.assignee_removed`
- `billing.plan_changed`
- `subscription.cancelled`
- `retention.purge_executed`

**Explanation:** Stable event names make filtering, reporting, and future exports easier.

---
