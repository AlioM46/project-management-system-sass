# Project API Test Cases

## Create Project

### Case: creates a project in the active workspace
- Setup: authenticated user is a member of workspace A and has `project.create`.
- Request: `POST /api/courses` with `X-Workspace-Id: {workspaceA}` and body `{ "name": "Marketing Website", "description": "Tasks related to the new website launch" }`.
- Expected status: `201`.
- Expected assertions:
  - `data.project.name` is `Marketing Website`.
  - `data.project.description` is `Tasks related to the new website launch`.
  - `data.project.workspace_id` equals workspace A.
  - `data.project.created_by_user_id` equals the authenticated user ID.
  - `data.project.deleted_at` is `null`.
  - Database row exists in `projects` with the same values and `active_name_key = "marketing website"`.

### Case: rejects an empty name
- Setup: authenticated user has `project.create` in workspace A.
- Request: `POST /api/courses` with body `{ "name": "" }`.
- Expected status: `422`.
- Expected assertions:
  - response error code is `VALIDATION_ERROR`.
  - validation includes `name`.
  - no `projects` row is created.

### Case: rejects a whitespace-only name
- Setup: authenticated user has `project.create` in workspace A.
- Request: `POST /api/courses` with body `{ "name": "   " }`.
- Expected status: `422`.
- Expected assertions:
  - response error code is `VALIDATION_ERROR`.
  - validation includes `name`.
  - no `projects` row is created.

### Case: rejects a duplicate active name in the same workspace
- Setup: workspace A already has active project `Roadmap`; authenticated user has `project.create`.
- Request: `POST /api/courses` with body `{ "name": "Roadmap" }`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_NAME_CONFLICT`.
  - database still contains only one active `Roadmap` in workspace A.

### Case: rejects a case-insensitive duplicate in the same workspace
- Setup: workspace A already has active project `Roadmap`; authenticated user has `project.create`.
- Request: `POST /api/courses` with body `{ "name": "roadmap" }`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_NAME_CONFLICT`.
  - conflict meta references workspace A.

### Case: allows the same name in a different workspace
- Setup: workspace A has active project `Roadmap`; authenticated user has `project.create` in workspace B.
- Request: `POST /api/courses` with `X-Workspace-Id: {workspaceB}` and body `{ "name": "Roadmap" }`.
- Expected status: `201`.
- Expected assertions:
  - created project belongs to workspace B.
  - both workspaces have one active project named `Roadmap`.

### Case: blocks create without permission
- Setup: authenticated user is a workspace member without `project.create`.
- Request: `POST /api/courses` with valid body.
- Expected status: `403`.
- Expected assertions:
  - no `projects` row is created.

## List and Show Projects

### Case: lists only projects in the active workspace
- Setup: workspace A has projects A1 and A2, workspace B has project B1, authenticated user can view both workspaces separately.
- Request: `GET /api/courses` with `X-Workspace-Id: {workspaceA}`.
- Expected status: `200`.
- Expected assertions:
  - `data.count` is `2`.
  - `data.projects` contains A1 and A2 only.
  - no project from workspace B is returned.

### Case: excludes deleted projects by default
- Setup: workspace A has one active project and one soft-deleted project; authenticated user has `project.view`.
- Request: `GET /api/courses`.
- Expected status: `200`.
- Expected assertions:
  - response includes only the active project.
  - `data.count` excludes the deleted project.

### Case: includes deleted projects when explicitly requested
- Setup: workspace A has one active project and one soft-deleted project; authenticated user has `project.view`.
- Request: `GET /api/courses?include_deleted=true`.
- Expected status: `200`.
- Expected assertions:
  - response includes both projects.
  - deleted project has non-null `deleted_at`.

### Case: filters project list by search term
- Setup: workspace A has `Marketing Website`, `Engineering Roadmap`, and `Bug Bash`.
- Request: `GET /api/courses?search=road`.
- Expected status: `200`.
- Expected assertions:
  - response includes `Engineering Roadmap`.
  - response excludes non-matching projects.

### Case: shows a project in the active workspace
- Setup: workspace A has active project P1; authenticated user has `project.view`.
- Request: `GET /api/courses/{P1}`.
- Expected status: `200`.
- Expected assertions:
  - `data.project.id` equals P1.
  - `data.project.workspace_id` equals workspace A.

### Case: hides a deleted project from normal detail reads
- Setup: workspace A has soft-deleted project P1; authenticated user has `project.view`.
- Request: `GET /api/courses/{P1}`.
- Expected status: `404`.
- Expected assertions:
  - response error code is `PROJECT_NOT_FOUND`.

### Case: allows explicit deleted detail reads
- Setup: workspace A has soft-deleted project P1; authenticated user has `project.view`.
- Request: `GET /api/courses/{P1}?include_deleted=true`.
- Expected status: `200`.
- Expected assertions:
  - returned project is P1.
  - `deleted_at` is non-null.

### Case: blocks cross-workspace detail access
- Setup: project P1 belongs to workspace B; authenticated user sends `X-Workspace-Id: {workspaceA}` and has `project.view` in workspace A.
- Request: `GET /api/courses/{P1}`.
- Expected status: `404`.
- Expected assertions:
  - response error code is `PROJECT_NOT_FOUND`.

## Update Project

### Case: updates name and description for an active project
- Setup: workspace A has active project P1; authenticated user has `project.update`.
- Request: `PATCH /api/courses/{P1}` with body `{ "name": "Website Relaunch", "description": "Updated scope and delivery plan" }`.
- Expected status: `200`.
- Expected assertions:
  - `data.project.name` is `Website Relaunch`.
  - `data.project.description` is `Updated scope and delivery plan`.
  - database row has `active_name_key = "website relaunch"`.

### Case: rejects rename to a conflicting active name
- Setup: workspace A has active projects `Roadmap` and `Backlog`; authenticated user has `project.update`.
- Request: `PATCH /api/courses/{Backlog}` with body `{ "name": "roadmap" }`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_NAME_CONFLICT`.
  - original project name remains unchanged in the database.

### Case: blocks updates to a deleted project
- Setup: workspace A has soft-deleted project P1; authenticated user has `project.update`.
- Request: `PATCH /api/courses/{P1}` with body `{ "name": "Recovered Name" }`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_DELETED_IMMUTABLE`.
  - project row remains deleted and unchanged.

### Case: blocks update without permission
- Setup: authenticated user is a member without `project.update`.
- Request: `PATCH /api/courses/{P1}` with valid body.
- Expected status: `403`.
- Expected assertions:
  - database row remains unchanged.

## Delete Project

### Case: soft deletes an active project
- Setup: workspace A has active project P1; authenticated user has `project.delete`.
- Request: `DELETE /api/courses/{P1}`.
- Expected status: `204`.
- Expected assertions:
  - response body is empty.
  - database row for P1 has non-null `deleted_at`.
  - database row for P1 has `active_name_key = null`.

### Case: allows name reuse after delete
- Setup: workspace A has active project `Roadmap`; authenticated user has `project.delete` and `project.create`.
- Request:
  - `DELETE /api/courses/{RoadmapId}`
  - then `POST /api/courses` with body `{ "name": "Roadmap" }`
- Expected status:
  - delete: `204`
  - create: `201`
- Expected assertions:
  - new active `Roadmap` row is created successfully.
  - deleted original remains stored with non-null `deleted_at`.

### Case: blocks delete of an already deleted project
- Setup: workspace A has soft-deleted project P1; authenticated user has `project.delete`.
- Request: `DELETE /api/courses/{P1}`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_ALREADY_DELETED`.

### Case: blocks delete without permission
- Setup: authenticated user is a member without `project.delete`.
- Request: `DELETE /api/courses/{P1}`.
- Expected status: `403`.
- Expected assertions:
  - project remains active in the database.

## Restore Project

### Case: restores a deleted project
- Setup: workspace A has soft-deleted project P1; authenticated user has `project.restore`.
- Request: `POST /api/courses/{P1}/restore`.
- Expected status: `200`.
- Expected assertions:
  - `data.project.id` equals P1.
  - `data.project.deleted_at` is `null`.
  - database row has `active_name_key` restored to the normalized name.

### Case: blocks restore when an active name conflict exists
- Setup: workspace A has deleted project `Roadmap` and active project `roadmap`; authenticated user has `project.restore`.
- Request: `POST /api/courses/{deletedRoadmapId}/restore`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_NAME_CONFLICT`.
  - deleted project remains deleted.

### Case: blocks restore of a non-deleted project
- Setup: workspace A has active project P1; authenticated user has `project.restore`.
- Request: `POST /api/courses/{P1}/restore`.
- Expected status: `409`.
- Expected assertions:
  - response error code is `PROJECT_NOT_DELETED`.

### Case: blocks restore without permission
- Setup: authenticated user is a member without `project.restore`.
- Request: `POST /api/courses/{P1}/restore`.
- Expected status: `403`.
- Expected assertions:
  - project remains deleted in the database.
