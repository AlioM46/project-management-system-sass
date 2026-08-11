# EPIC 2 â Workspace (Tenant Core)

## Epic Scope
Workspace lifecycle, membership, invites, and tenant isolation enforcement.

**Explanation:** Workspace is the tenant boundary. Every project, task, comment, notification, audit log, report, and billing subscription belongs to a workspace. This epic prevents cross-company data leaks.

## Feature 2.1 â Create Workspace

### User Story
As a user, I want to create a workspace so that I can manage a team.

### Services / Actions Used
- **Action:** `CreateWorkspace`
- **Service:** `WorkspaceService`
- **Service:** `MembershipService`
- **Service:** `RoleBootstrapService`

### Domain Rules
- Creator becomes a member immediately.
- Creator becomes Admin immediately.
- Workspace must always have at least one Admin.

### Tasks
- **DB**
  - `workspaces`:
    - id
    - name
    - created_by_user_id
    - timestamps
  - `workspace_members`:
    - id
    - workspace_id
    - user_id
    - role_id
    - joined_at
    - timestamps
    - unique(workspace_id, user_id)
- **API**
  - `POST /workspaces`
- **Implementation**
  - create workspace
  - bootstrap default roles
  - add creator as Admin
- **Tests**
  - creator is member
  - creator is admin
  - duplicate membership blocked

## Feature 2.2 â List My Workspaces

### User Story
As a user, I want to list my workspaces so that I can select one.

### Services / Actions Used
- **Action:** `ListUserWorkspaces`
- **Service:** `WorkspaceQueryService`

### Domain Rules
- Return only workspaces where authenticated user has membership.
- Does not require `X-Workspace-Id`.

### Tasks
- **API**
  - `GET /workspaces`
- **Implementation**
  - query through `workspace_members`
- **Tests**
  - user sees only their own workspaces

## Feature 2.3 â Workspace Context Validation

### User Story
As the system, I want strict workspace context validation so that tenant isolation is guaranteed.

### Services / Actions Used
- **Middleware:** `WorkspaceContextMiddleware`
- **Service:** `WorkspaceContextService`

### Domain Rules
- Missing header => `400`.
- Invalid header => `400`.
- Workspace not found => `400`.
- Not a member => `403`.

### Tasks
- **Middleware**
  - read `X-Workspace-Id`
  - validate format
  - load workspace
  - verify membership
  - store workspace context for request lifecycle
- **Tests**
  - missing header returns `400`
  - invalid header returns `400`
  - non-member returns `403`
  - member passes

## Feature 2.4 â Automatic Tenant Scoping

### User Story
As the system, I want tenant filtering automatic so developers cannot forget it.

### Services / Actions Used
- **Trait:** `BelongsToWorkspace`
- **Service:** `WorkspaceContextService`

### Domain Rules
- Tenant-owned models must always query by `workspace_id`.
- `workspace_id` must be auto-filled on create.

### Tasks
- Implement global scope.
- Auto-fill `workspace_id` on creating.
- Apply trait to tenant models.
- **Tests**
  - cannot query cross-workspace records by guessing IDs

## Feature 2.5 â Invite Member

### User Story
As a workspace admin, I want to create an invite token so that a user can join.

### Services / Actions Used
- **Action:** `CreateWorkspaceInvite`
- **Service:** `InviteService`
- **Service:** `MembershipService`
- **Service:** `AuthorizationService`

### Domain Rules
- Token must be cryptographically secure.
- Invite must expire.
- Invite cannot be reused.
- Invite may be restricted by email.

### Tasks
- **DB**
  - `workspace_invites`:
    - id
    - workspace_id
    - token unique
    - email nullable
    - role_id nullable
    - created_by_user_id
    - expires_at
    - used_at
    - timestamps
- **API**
  - `POST /invites`
- **Tests**
  - admin can create
  - non-admin forbidden
  - token uniqueness

## Feature 2.6 â Invite Lookup

### User Story
As an invited user, I want to validate an invite token so that I can see it is valid.

### Services / Actions Used
- **Action:** `GetWorkspaceInvite`
- **Service:** `InviteService`

### Domain Rules
- Invalid, expired, or used tokens must be rejected.
- Endpoint is global and does not require workspace header.

### Tasks
- **API**
  - `GET /invites/{token}`
- **Tests**
  - invalid token fails
  - expired token fails
  - used token fails

## Feature 2.7 â Accept Invite

### User Story
As a user, I want to accept an invite so that I join the workspace.

### Services / Actions Used
- **Action:** `AcceptWorkspaceInvite`
- **Service:** `InviteService`
- **Service:** `MembershipService`

### Domain Rules
- Accept must be atomic.
- Email restriction must be enforced if set.
- Invite cannot be accepted twice.

### Tasks
- **API**
  - `POST /invites/{token}/accept`
- **Implementation**
  - validate invite
  - enforce email restriction
  - create membership
  - mark invite used
  - wrap in transaction
- **Tests**
  - accept creates membership
  - cannot accept twice
  - email restriction enforced

## Feature 2.8 â Member Management

### User Story
As an admin, I want to manage members so that workspace access is controlled.

### Services / Actions Used
- **Action:** `ListMembers`
- **Action:** `ChangeMemberRole`
- **Action:** `RemoveMember`
- **Service:** `MembershipService`

### Domain Rules
- Workspace must always have at least one Admin.
- Removing last Admin is forbidden.
- Self-demotion must not violate admin minimum rule.

### Tasks
- **API**
  - `GET /members`
  - `PATCH /members/{userId}/role`
  - `DELETE /members/{userId}`
- **Tests**
  - last admin cannot be removed
  - role change works
  - viewer/non-admin forbidden

---
