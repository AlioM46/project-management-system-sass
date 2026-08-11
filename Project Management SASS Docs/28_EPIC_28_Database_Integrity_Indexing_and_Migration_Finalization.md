# EPIC 28 â Database Integrity, Indexing, and Migration Finalization

## Epic Scope
Final database schema audit before backend freeze.

**Explanation:** Application validation is not enough. Database constraints protect correctness when bugs, concurrency, or direct writes happen.

## Feature 28.1 â Constraint Audit

### Domain Rules
- Foreign keys should protect relationships.
- Unique constraints should enforce invariants.
- Nullable fields must be intentional.

### Required Constraints
- `users.email` unique
- `workspace_members` unique(workspace_id, user_id)
- `permissions.key` unique
- `roles` unique(workspace_id, name)
- `role_permissions` unique(role_id, permission_id)
- `task_assignments` unique(task_id, user_id)
- `mentions` unique(comment_id, mentioned_user_id)
- `notification_preferences` unique(workspace_id, user_id)
- `billing_webhook_events.provider_event_id` unique

## Feature 28.2 â Index Audit

### Required Indexes
- all `workspace_id` columns
- `tasks(workspace_id, status, due_at)`
- `tasks(workspace_id, project_id, status)`
- `task_assignments(user_id, task_id)`
- `task_history(workspace_id, task_id, event_type, created_at)`
- `notifications(workspace_id, recipient_user_id, read_at)`
- `audit_logs(workspace_id, event_type, created_at)`
- `audit_logs(workspace_id, actor_user_id, created_at)`

## Feature 28.3 â Transaction Boundary Audit

### Writes That Must Be Transactional
- create workspace + membership + role bootstrap
- accept invite + membership + mark invite used
- create task + assignments + history
- status update + history
- role permission sync
- billing webhook processing
- retention purge

## Feature 28.4 â Migration Finalization

### Tasks
- Review all migrations.
- Ensure consistent column naming.
- Ensure timestamps/soft deletes where needed.
- Ensure cascade/restrict rules are intentional.
- Run fresh migration and seed from zero.

---
