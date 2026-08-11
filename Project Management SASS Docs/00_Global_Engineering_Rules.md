# Complete 30-Epic Backend Plan â Multi-Workspace Project Management SaaS

**System:** Multi-Workspace Project Management SaaS  
**Backend:** Laravel API  
**Frontend:** Next.js SPA  
**Database:** MySQL  
**Architecture:** Modular Monolith  
**Authentication:** Laravel Sanctum SPA Cookies  

---

# Global Engineering Rules

**Explanation:** These rules apply to every epic. They protect the SaaS from duplicated business logic, tenant leaks, inconsistent authorization, and unpredictable side effects.

1. **No business logic in controllers**
   - Controllers only validate request, call Action/Service, and return response.

2. **All workspace-scoped requests must validate tenant context**
   - Require `X-Workspace-Id`.
   - Validate workspace exists.
   - Validate authenticated user is a member.
   - Missing or invalid header => `400`.
   - Non-member => `403`.

3. **All tenant-owned tables must include `workspace_id`**
   - Tenant isolation is enforced by:
     - `WorkspaceContextMiddleware`
     - `BelongsToWorkspace` trait / global model scope

4. **Authorization is permission-key based**
   - Permissions are keys like `task.assign`, `project.update`, `role.sync_permissions`.
   - Roles are sets of permissions.
   - Roles are workspace-scoped.

5. **No duplication of security logic**
   - Workspace validation happens in middleware only.
   - Permission resolution happens in Authorization module only.
   - Workflow transitions happen in Workflow module only.
   - Audit logs go through `AuditLogger` only.
   - Notifications go through `NotificationService` only.

6. **All writes must produce predictable side effects**
   - Workflow change => History + optional Notification + Audit.
   - Role/permission change => Audit.
   - Mention/assignment => Notification.
   - Billing change => Audit + entitlement recalculation.

7. **All list endpoints must support**
   - Pagination.
   - Sorting.
   - Basic filtering where applicable.

8. **All critical writes should be transactional**
   - If multiple tables must change together, use `DB::transaction()`.
   - If side effects happen after commit, dispatch events/jobs after commit.

9. **Every module should have tests**
   - Success path.
   - Validation failure.
   - Authorization failure.
   - Cross-workspace denial.
   - Side effects.

---
