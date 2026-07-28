# `/dashboard/tasks` Simplified Flow

## Main Idea
The page is now easier to read because it is split into only 4 main UI parts:

- `TasksPage`
- `TasksToolbar`
- `TasksBoard`
- `TaskCard`

There is also one small helper UI for quick creation:

- `InlineTaskCreateCard`

And the existing details modal:

- `TaskDetailsModal`

## What Each File Does

### `client/app/dashboard/tasks/page.tsx`
This is the brain.

It is responsible for:
- loading tasks, projects, and members
- storing page state
- creating a task
- updating a task status
- handling drag and drop
- opening the task details modal

If you want to understand the real behavior of the page, start here.

### `client/components/tasks/TasksToolbar.tsx`
This is the top area.

It shows:
- page title
- new task button
- project filter
- assignee filter
- sort by
- sort direction
- clear filters

It does not fetch data.
It does not update tasks directly.
It only sends the user’s choices back to `page.tsx`.

### `client/components/tasks/TasksBoard.tsx`
This is the kanban board.

It shows:
- all status columns
- each task card
- the inline create form inside a column

It is responsible only for board UI.
It does not own the main page state.

### `client/components/tasks/TaskCard.tsx`
This is one task.

It shows:
- title
- short description
- assignee avatars
- status dropdown

It can:
- open the task modal
- ask the page to load allowed statuses
- ask the page to change status

### `client/components/tasks/InlineTaskCreateCard.tsx`
This is the small create form at the bottom of a column.

It lets the user:
- type a task name
- choose a project
- save the task directly into that column’s status

## Real Scenario

### 1. Open `/dashboard/tasks`
When the page opens:

1. `TasksPage` mounts.
2. `fetchTasks()` runs.
3. It calls these APIs in parallel:
   - `getTasks(...)`
   - `getProjects()`
   - `getMembers()`
4. The results are stored in state.
5. That state is passed down to `TasksToolbar` and `TasksBoard`.

## 2. Filter tasks
When the user changes the project filter:

1. `TasksToolbar` calls `onProjectChange(...)`.
2. `TasksPage` updates `filters`.
3. Because `filters` changed, `fetchTasks()` runs again.
4. The board re-renders with the new tasks.

The assignee filter and sort controls work the same way.

## 3. Create a task in any status
When the user clicks the plus button in a column:

1. `TasksBoard` tells `TasksPage` which column was chosen.
2. `TasksPage` stores that in `creatingInColumn`.
3. `InlineTaskCreateCard` appears in that column.
4. The user types the title and presses save.
5. `TasksPage` calls `createTask(...)` with:
   - `title`
   - `project_id`
   - `status`
6. The status comes from the column itself.
7. After success, the page reloads tasks.

That is how you can create directly in `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, or `CANCELLED`.

## 4. Change task status from dropdown
When the user opens the status dropdown:

1. `TaskCard` asks `TasksPage` to load allowed statuses for that task.
2. `TasksPage` calls `getTaskTransitions(taskId)` if they are not already cached.
3. The dropdown disables locked statuses.

When the user picks a new status:

1. `TaskCard` calls `onStatusChange(taskId, newStatus)`.
2. `TasksPage` runs `updateTaskStatus(...)`.
3. The page updates the task locally first.
4. Then it calls `updateTask(taskId, { status: newStatus })`.
5. If the API fails, the page reloads the real task list.

## 5. Drag and drop
When the user drags a task into another column:

1. `TasksBoard` gives the drop result to `TasksPage`.
2. `TasksPage` checks the destination status.
3. If needed, it loads allowed statuses for that task.
4. If the transition is not allowed, it shows an error toast.
5. If the transition is allowed, it calls `updateTaskStatus(...)`.

This is simpler than the old version because drag-and-drop no longer depends on hovering the card first.

## 6. Open task details
When the user clicks a task card:

1. `TaskCard` calls `onOpen(task.id)`.
2. `TasksPage` stores `selectedTaskId`.
3. `TasksPage` finds the matching task from the `tasks` array.
4. `TaskDetailsModal` opens with that task.

## Reading Order
If you want to understand the page quickly, use this order:

1. `page.tsx`
2. `TasksToolbar.tsx`
3. `TasksBoard.tsx`
4. `TaskCard.tsx`
5. `InlineTaskCreateCard.tsx`

## Short Summary
- `page.tsx` contains the logic.
- `TasksToolbar` contains the top controls.
- `TasksBoard` contains the columns.
- `TaskCard` contains one task.
- `InlineTaskCreateCard` creates a task directly in a chosen status.
