# EPIC 16 â File Attachments and Storage

## Epic Scope
Task/project/comment attachments with secure storage and authorization.

**Explanation:** Attachments are common in project management. If you skip this, the product can still work, but users often expect files on tasks.

## Feature 16.1 â Upload Attachment

### Services / Actions Used
- **Action:** `UploadAttachment`
- **Service:** `AttachmentService`
- **Service:** `StorageService`
- **Service:** `EntitlementService`

### Domain Rules
- Attachment belongs to workspace.
- Attachment belongs to an attachable resource.
- User must have permission to attach file.
- Workspace storage limit must be checked.

### Tasks
- **DB**
  - `attachments`:
    - id
    - workspace_id
    - attachable_type
    - attachable_id
    - uploaded_by_user_id
    - original_name
    - disk
    - path
    - mime_type
    - size_bytes
    - checksum nullable
    - timestamps
    - soft deletes
- **API**
  - `POST /attachments`
- **Validation**
  - file required
  - file size limit
  - allowed mime types
- **Tests**
  - upload works
  - unauthorized denied
  - storage limit enforced

## Feature 16.2 â Download Attachment

### Services / Actions Used
- **Action:** `DownloadAttachment`
- **Service:** `AttachmentService`

### Domain Rules
- Must authorize access to parent resource.
- Use temporary signed URLs or streamed response.

### Tasks
- **API**
  - `GET /attachments/{id}/download`
- **Tests**
  - owner workspace can download
  - cross-workspace denied

## Feature 16.3 â Delete Attachment

### Domain Rules
- Soft delete first.
- Physical purge can happen through retention.

### Tasks
- **API**
  - `DELETE /attachments/{id}`

---
