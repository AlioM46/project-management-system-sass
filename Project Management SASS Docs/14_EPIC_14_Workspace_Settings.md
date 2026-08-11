# EPIC 14 â Workspace Settings

## Epic Scope
Workspace profile, preferences, ownership-sensitive settings, and deletion flow.

**Explanation:** Workspace settings are tenant-level configuration. Keep them separate from user profile settings.

## Feature 14.1 â Workspace Profile Settings

### Services / Actions Used
- **Action:** `UpdateWorkspaceSettings`
- **Service:** `WorkspaceSettingsService`
- **Service:** `AuditLogger`

### Domain Rules
- Only authorized members can update workspace settings.
- Changes must be audited.

### Tasks
- **DB**
  - add to `workspaces`:
    - timezone nullable
    - logo_path nullable
    - settings JSON nullable
- **API**
  - `GET /workspace/settings`
  - `PATCH /workspace/settings`
- **Tests**
  - admin can update
  - unauthorized user denied
  - audit log created

## Feature 14.2 â Workspace Logo

### Services / Actions Used
- **Service:** `WorkspaceLogoService`
- **Service:** `StorageService`

### Domain Rules
- Validate file type and size.
- Store privately or in controlled public disk.

### Tasks
- **API**
  - `POST /workspace/logo`
  - `DELETE /workspace/logo`

## Feature 14.3 â Workspace Deletion Request

### Services / Actions Used
- **Action:** `RequestWorkspaceDeletion`
- **Service:** `WorkspaceDeletionService`

### Domain Rules
- Must require high-level permission.
- Must be audited.
- May use delayed deletion window.

### Tasks
- **API**
  - `DELETE /workspace`
- **Tests**
  - deletion request created
  - unauthorized user denied

---
