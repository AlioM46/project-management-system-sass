# EPIC 11 â Reporting

## Epic Scope
Workspace-scoped operational reports for tasks and productivity.

**Explanation:** Reporting converts existing task and workflow data into useful insights. It must be efficient, indexed, paginated, and permission protected.

## Feature 11.1 â Overdue Tasks

### User Story
As a manager, I want to see overdue tasks so I can take action.

### Services / Actions Used
- **Service:** `OverdueReportService`

### Domain Rules
- Exclude `DONE`.
- Workspace-scoped.
- Paginated.
- Requires `tasks.due_at`.

### Tasks
- **API**
  - `GET /reports/overdue-tasks`
- **Filters**
  - project_id
  - assignee_id
  - status
  - due_before
- **Indexes**
  - `(workspace_id, status, due_at)`
  - `(workspace_id, project_id, status)`
- **Tests**
  - done tasks excluded
  - overdue tasks returned
  - workspace scope enforced

## Feature 11.2 â Cycle Time

### User Story
As a manager, I want to measure how long tasks take from start to done.

### Services / Actions Used
- **Service:** `CycleTimeReportService`

### Domain Rules
- Use `task_history`.
- Compute Ready/Started to Done duration.
- Queries must be efficient with indexes.

### Tasks
- **API**
  - `GET /reports/cycle-time`
- **Data Source**
  - `task_history` status changes
- **Indexes**
  - `(workspace_id, task_id, event_type, created_at)`
- **Tests**
  - duration calculated correctly
  - tasks without Done excluded or handled consistently

## Feature 11.3 â Task Summary

### Services / Actions Used
- **Service:** `TaskSummaryReportService`

### Domain Rules
- Workspace-scoped.
- Aggregates by status, project, and assignee.

### Tasks
- **API**
  - `GET /reports/task-summary`
- **Metrics**
  - total tasks
  - open tasks
  - done tasks
  - blocked tasks
  - overdue tasks

## Feature 11.4 â Member Workload

### Services / Actions Used
- **Service:** `MemberWorkloadReportService`

### Domain Rules
- Count assigned open tasks per member.
- Exclude deleted tasks.

### Tasks
- **API**
  - `GET /reports/member-workload`

---
