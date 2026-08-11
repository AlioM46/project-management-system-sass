# EPIC 4 â Projects

## Epic Scope
Workspace-scoped project lifecycle.

**Explanation:** Project is the container for tasks. Project writes are not comments or chat. They are changes to the project resource itself.

## Feature 4.1 â Project Creation

### User Story
As a member, I want to create projects so that I can organize tasks.

### Services / Actions Used
- **Action:** `CreateProject`
- **Service:** `ProjectService`
- **Service:** `AuthorizationService`

### Domain Rules
- Project belongs to workspace.
- Name must not be empty.
- Only authorized users can create.

### Tasks
- **DB**
  - `projects`:
    - id
    - workspace_id
    - name
    - description
    - created_by_user_id
    - timestamps
    - soft deletes
- **API**
  - `POST /projects`
- **Implementation**
  - enforce workspace context
  - enforce permission `project.create`
- **Tests**
  - project created
  - cross-workspace access blocked

## Feature 4.2 â Project List and Detail

### User Story
As a member, I want to view projects in my workspace.

### Services / Actions Used
- **Action:** `ListProjects`
- **Action:** `GetProject`
- **Service:** `ProjectQueryService`

### Domain Rules
- Only workspace projects are visible.
- List must support pagination, sorting, and filtering.

### Tasks
- **API**
  - `GET /projects`
  - `GET /projects/{id}`
- **Filters**
  - name
  - created_by_user_id
  - deleted status if authorized
- **Tests**
  - list scoped to workspace
  - detail scoped to workspace

## Feature 4.3 â Project Lifecycle

### Services / Actions Used
- **Action:** `UpdateProject`
- **Action:** `DeleteProject`
- **Action:** `RestoreProject`
- **Service:** `ProjectService`

### Domain Rules
- Soft deletes only.
- Deleted project cannot accept new tasks.
- Restore allowed only if authorized.

### Tasks
- **API**
  - `PATCH /projects/{id}`
  - `DELETE /projects/{id}`
  - `POST /projects/{id}/restore`
- **Tests**
  - update works
  - soft delete works
  - deleted project rejects new tasks
  - restore works

---
