- # Project Plan (Epic→Feature ↔ User Story ↔ Tasks)
    - **System:** Multi-Workspace Project Management SaaS
    - **Backend:** Laravel API (Sanctum SPA cookies)
    - **Frontend:** Next.js SPA
    - **DB:** MySQL
    - **Architecture:** Modular Monolith (modules inside one codebase)
    - 
    - # Global Engineering Rules (Apply to Entire System)
        1. **No business logic in controllers**
            - Controllers only: validate request→call Action/Service ↔ return response.
        2. **All workspace-scoped requests must validate tenant context**
            - Require `X-Workspace-Id`
            - Validate workspace exists
            - Validate authenticated user is a member
            - Non-member => **403**
            - Missing/invalid header => **400**
        3. **All tenant-owned tables must include **`**workspace_id**`
            - Tenant isolation is enforced by:
                - WorkspaceContextMiddleware
                - Global model scope (`BelongsToWorkspace` trait)
        4. **Authorization is permission-key based**
            - Permissions are keys like `task.assign`, `role.update`
            - Roles are sets of permissions
            - Roles are workspace-scoped (custom roles per workspace)
        5. **No duplication of security logic**
            - Workspace context validation happens in middleware only
            - Permission resolution happens in Authorization module only
            - Workflow transitions happen in WorkflowService only
            - Audit logs go through AuditLogger only
            - Notifications go through NotificationService only
        6. **All writes must produce predictable side-effects**
            - Workflow changes => History + (optional) Notifications + Audit
            - Role/permission changes => Audit
            - Mention/assignment => Notification
        7. **All list endpoints must support**
            - pagination
            - sorting
            - basic filtering (where applicable)
- 
