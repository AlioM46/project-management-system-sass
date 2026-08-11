# EPIC 3 â Authorization (RBAC)

## Epic Scope
Workspace-scoped Role-Based Access Control.
Authorization is permission-key driven.

**Explanation:** Authentication tells who the user is. Authorization tells what the user is allowed to do inside a workspace. This must be centralized so security is consistent.

## Feature 3.1 â Permission Catalog

### User Story
As the system, I want a centralized permission registry so access control is consistent.

### Services / Actions Used
- **Service:** `PermissionRegistryService`

### Domain Rules
- Permission keys must be unique.
- Keys must follow dot notation.
- Permissions are global definitions.
- Roles reference permissions.

### Tasks
- **DB**
  - `permissions`:
    - id
    - key unique
    - description
    - timestamps
- **Seed**
  - `workspace.*`
  - `member.*`
  - `role.*`
  - `project.*`
  - `task.*`
  - `comment.*`
  - `notification.*`
  - `audit.*`
  - `report.*`
  - `billing.*`
  - `settings.*`
  - `file.*`
- **Tests**
  - duplicate permission key fails

## Feature 3.2 â Role Management

### User Story
As an admin, I want to create and manage roles so I can control permissions inside my workspace.

### Services / Actions Used
- **Action:** `CreateRole`
- **Action:** `UpdateRole`
- **Action:** `DeleteRole`
- **Action:** `SyncRolePermissions`
- **Service:** `RoleService`
- **Service:** `AuthorizationService`

### Domain Rules
- Roles are workspace-scoped.
- System roles cannot be deleted.
- Assigned roles cannot be deleted unless members are reassigned.
- Role names must be unique within workspace.

### Tasks
- **DB**
  - `roles`:
    - id
    - workspace_id
    - name
    - is_system
    - timestamps
    - unique(workspace_id, name)
  - `role_permissions`:
    - role_id
    - permission_id
    - unique(role_id, permission_id)
- **API**
  - `GET /roles`
  - `POST /roles`
  - `PATCH /roles/{id}`
  - `DELETE /roles/{id}`
  - `PUT /roles/{id}/permissions`
- **Tests**
  - cannot delete assigned role
  - unique role name enforced
  - permission sync works

## Feature 3.3 â Permission Enforcement

### User Story
As the system, I want permission checks centralized so security rules are consistent.

### Services / Actions Used
- **Service:** `AuthorizationService`
- **Middleware:** `PermissionMiddleware`

### Domain Rules
- Permission checks must not be duplicated in controllers.
- All permission resolution must go through `AuthorizationService`.
- Membership must exist before permission resolution.

### Tasks
- Implement `AuthorizationService::hasPermission($user, string $permissionKey)`.
- Resolve membership, role, and permissions.
- Integrate with Laravel Gate or custom middleware.
- Protect workspace routes with permission middleware.
- **Tests**
  - allow scenarios
  - deny scenarios
  - cross-workspace denial

---
