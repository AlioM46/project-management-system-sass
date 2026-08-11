# EPIC 18 â Exports

## Epic Scope
Export workspace data and reports safely.

**Explanation:** Exports are important for business users. Large exports should be queued, not generated inside request-response.

## Feature 18.1 â Export Tasks

### Services / Actions Used
- **Action:** `CreateTaskExport`
- **Job:** `GenerateTaskExport`
- **Service:** `ExportService`

### Domain Rules
- Export is workspace-scoped.
- Export respects permissions.
- Large exports are queued.
- Export files expire.

### Tasks
- **DB**
  - `exports`:
    - id
    - workspace_id
    - requested_by_user_id
    - type
    - status
    - filters JSON nullable
    - file_path nullable
    - expires_at nullable
    - timestamps
- **API**
  - `POST /exports/tasks`
  - `GET /exports/{id}`
  - `GET /exports/{id}/download`
- **Tests**
  - export requested
  - job generates file
  - unauthorized denied

## Feature 18.2 â Export Audit Logs

### Services / Actions Used
- **Action:** `CreateAuditExport`
- **Job:** `GenerateAuditExport`

### Domain Rules
- Requires `audit.export` or equivalent permission.
- Must preserve filters.

### API
- `POST /exports/audit-logs`

## Feature 18.3 â Export Reports

### API
- `POST /exports/reports/overdue-tasks`
- `POST /exports/reports/cycle-time`

---
