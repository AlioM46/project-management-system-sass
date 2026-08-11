# EPIC 10 â Retention Policy

## Epic Scope
Scheduled cleanup of old soft-deleted records and temporary data.

**Explanation:** Retention protects the database from growing forever. It also makes deletion behavior predictable. This must be safe because deleting parent records before child records can break integrity.

## Feature 10.1 â Scheduled Purge

### User Story
As the system, I want old soft-deleted records purged safely after a configured retention period.

### Services / Actions Used
- **Service:** `RetentionService`
- **Command:** `PurgeSoftDeletedRecords`

### Domain Rules
- `retention_days` is configurable.
- Purge must follow safe cascade order.
- Purge should support dry run.
- Purge must produce audit log.

### Tasks
- **Config**
  - `config/retention.php`
  - `retention_days`
  - `notification_retention_days`
  - `audit_log_retention_days`
- **Command**
  - `php artisan retention:purge-soft-deleted`
  - `php artisan retention:purge-soft-deleted --dry-run`
- **Scheduler**
  - run daily or weekly
- **Safe Order**
  - comments
  - mentions
  - notifications
  - task_assignments
  - task_history
  - tasks
  - projects
  - workspace_invites
- **Tests**
  - dry run deletes nothing
  - old records purged
  - fresh records preserved
  - audit log created

## Feature 10.2 â Retention Policy Per Plan

### Services / Actions Used
- **Service:** `RetentionPolicyResolver`
- **Service:** `EntitlementService`

### Domain Rules
- Paid plans may have longer audit retention.
- Free plans may have shorter data retention.

### Tasks
- Connect retention rules to plan entitlements.
- Do not delete records required for billing compliance.
- Test plan-specific retention behavior.

---
