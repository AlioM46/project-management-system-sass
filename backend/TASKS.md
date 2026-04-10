You are working on an existing multi-tenant project management backend.

Context:
- Tenancy is workspace-based.
- Roles are currently partly hardcoded.
- Built-in/system roles include at least Owner and Admin, and Member may also exist.
- Some existing authorization checks still directly check whether the current workspace member is admin or owner.
- The codebase also already uses permission middleware/helpers like canDo(permissionName).
- There is already a defaults/sync mechanism for default roles.
- We want an incremental, backward-compatible RBAC improvement, not a full rewrite.

Your task:
Implement a safe hybrid role system upgrade with protected system roles and CRUD only for custom roles.

Main goals:
1. Introduce stable role slugs.
2. Add system protection columns on roles.
3. Keep and strengthen defaults/sync for creating system roles.
4. Add CRUD only for custom roles.
5. Preserve backward compatibility with existing owner/admin checks.
6. Keep using permission-based checks for normal actions.
7. Enforce strict workspace scoping and prevent privilege escalation.
8. Add tests.

Detailed requirements:

A) Stable role slugs
- Add a stable `slug` field to roles.
- Built-in roles must use stable slugs:
  - owner
  - admin
  - member
- Refactor existing hardcoded role-name checks to prefer stable slugs instead of display names.
- Keep display names for UI, but internal logic must rely on slugs.

B) System role protection columns
- Add the following columns to the roles table/model:
  - slug
  - is_system
  - is_editable
  - is_deletable
- Set defaults for built-in roles:
  - owner: is_system=true, is_editable=false, is_deletable=false
  - admin: is_system=true, is_editable=false, is_deletable=false
  - member: is_system=true, is_editable=false, is_deletable=false
- Custom roles should default to:
  - is_system=false
  - is_editable=true
  - is_deletable=true

C) Keep and improve defaults/sync
- Preserve the existing defaults/sync flow.
- Make it the canonical idempotent way to ensure each workspace has the built-in system roles.
- It must:
  - create missing system roles
  - assign correct slugs and protection flags
  - avoid duplicates
  - be safe to run multiple times
  - optionally ensure required default permissions remain attached to built-in roles

D) Add CRUD only for custom roles
Implement or update these role endpoints/services/actions:
- POST /roles-permissions/roles
- GET /roles-permissions/roles/{role_id}
- PATCH /roles-permissions/roles/{role_id}
- DELETE /roles-permissions/roles/{role_id}
- PUT /roles-permissions/roles/{role_id}/permissions

Rules:
- Only non-system roles can be updated or deleted.
- Creating reserved built-in roles or reserved slugs must be blocked.
- Built-in roles must not be deletable.
- Built-in role slugs must not be mutable.
- All role operations must be workspace-scoped.

E) Hybrid authorization model
Do not convert the entire app to pure permission-based authorization.
Keep a hybrid model:

1. Keep role slug checks for special system actions, such as:
- ownership transfer
- last-owner protection
- any other ownership-critical actions already depending on owner/admin semantics

***** DO NOT CHANGE THE LOGIC OF THE APP, IT WORKS FINE, WE JUST HAVE TO MAINTAIN SOME CODE. *****

2. Keep or expand permission-based checks for standard actions, such as:
- inviting members
- changing member roles
- creating custom roles
- updating custom roles
- deleting custom roles
- assigning permissions to custom roles

F) Workspace scoping and tenant safety
- Every role lookup must be scoped by current workspace.
- Never fetch a role by ID only.
- Always resolve role within the current workspace context.
- When changing a member’s role, ensure:
  - the member belongs to the current workspace
  - the target role belongs to the current workspace
- Prevent cross-workspace role assignment or lookup bugs.

G) Privilege escalation protection
- When assigning permissions to a role, validate that all permission keys exist.
- Prevent unsafe privilege escalation.
- Preserve existing business rules for protected actions.
- If the requester is not allowed to grant certain sensitive permissions, reject the request.
- Do not allow user-created roles to impersonate built-in role identity via reserved names/slugs.

H) Deletion safety rules
- Deleting a custom role should fail if it is still assigned to workspace members.
- Return a clear validation/business error.
- Do not implement automatic reassignment unless required by existing architecture.
- Built-in roles must never be deletable.

I) Listing and representation
- Role list/show responses should expose fields useful to frontend/admin use:
  - id
  - name
  - slug
  - is_system
  - is_editable
  - is_deletable
  - member_count if available
  - permissions or permission summary if already part of the API style

J) Validation
Add request/service validation for:
- unique role name per workspace
- unique slug where relevant
- reserved names/slugs blocked
- permissions array shape and existence
- system-role mutability restrictions
- delete safety checks

K) Backward compatibility
- Do not break existing behavior that assumes Owner/Admin/Member exist.
- Preserve current authorization semantics where code still depends on Owner/Admin/member (if exist for member) checks.
- Make the change incremental and compatible with the existing codebase.
- Avoid broad rewrites outside the role/permission domain unless necessary for correctness.

L) Tests
Add or update tests covering:
- defaults/sync creates or repairs system roles correctly
- defaults/sync is idempotent
- built-in roles have correct slugs and protection flags
- custom role creation works
- custom role update works
- custom role deletion works only when safe
- built-in role update/delete is rejected
- reserved names/slugs are rejected
- permission assignment works for custom roles
- workspace scoping is enforced
- cross-workspace role access is rejected
- last-owner protections remain intact
- privilege escalation attempts are rejected where applicable

Implementation expectations:
- Follow the project’s existing architecture and conventions.
- Reuse current middleware/helpers like permissionCheck(permissionName) where appropriate.
- Keep the implementation clean, minimal, and incremental.
- Prefer service-layer or policy-based enforcement where the codebase already uses those patterns.
- Update migrations, models, seed/sync logic, validation, controllers/services, and tests as needed.

Deliverables:
- migrations/schema updates
- model updates
- sync/default-role logic updates
- role CRUD implementation for custom roles
- permission assignment endpoint/service updates
- validation and authorization updates
- tests
- brief developer notes in comments or a short summary explaining key changes and any places where old hardcoded checks were intentionally preserved for compatibility

Do not:
- remove or break existing Owner/Admin semantics
- make built-in system roles editable/deletable
- perform a massive unrelated authorization rewrite
- introduce frontend changes unless absolutely necessary


at the end.
-- if you finish, create Postman JSON or **upgrade** the existing json file
-- List All Tasks you have finished with file