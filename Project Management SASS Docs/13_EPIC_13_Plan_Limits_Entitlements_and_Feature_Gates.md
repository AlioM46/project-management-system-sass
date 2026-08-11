# EPIC 13 â Plan Limits, Entitlements, and Feature Gates

## Epic Scope
Determine what each workspace plan is allowed to use.

**Explanation:** Billing says whether the customer paid. Entitlements say what the workspace can use. RBAC checks the user. Entitlements check the workspace plan.

## Feature 13.1 â Entitlement Resolver

### Services / Actions Used
- **Service:** `EntitlementService`
- **Service:** `PlanLimitService`

### Domain Rules
- Entitlements are workspace-scoped.
- Expired/cancelled subscriptions reduce access according to business rule.
- RBAC and entitlements are separate checks.

### Tasks
- Resolve current workspace plan.
- Read feature flags and limits from plan.
- Cache entitlements if needed.
- **Tests**
  - free plan limits enforced
  - paid plan allows higher limits
  - expired subscription blocks paid features

## Feature 13.2 â Usage Limits

### Domain Rules
- Creating resources must check plan limits.

### Limit Examples
- `max_projects`
- `max_members`
- `max_tasks`
- `max_storage_mb`
- `advanced_reports_enabled`
- `custom_roles_enabled`
- `audit_retention_days`

### Tasks
- Check limit before creating project.
- Check limit before inviting member.
- Check storage limit before upload.
- Return consistent `PLAN_LIMIT_REACHED` error.

## Feature 13.3 â Feature Gates

### Domain Rules
- Feature gates must be centralized.
- Do not scatter plan checks in controllers.

### Tasks
- Implement methods:
  - `canUseAdvancedReports(workspace)`
  - `canCreateCustomRole(workspace)`
  - `canInviteMoreMembers(workspace)`
  - `canUploadFile(workspace, bytes)`

---
