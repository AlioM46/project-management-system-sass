# EPIC 17 â Search

## Epic Scope
Workspace-scoped and permission-aware search across projects, tasks, comments, and members.

**Explanation:** Filters are for structured fields. Search is for text discovery. Search must never leak data across workspaces.

## Feature 17.1 â Global Workspace Search

### Services / Actions Used
- **Action:** `SearchWorkspace`
- **Service:** `SearchService`

### Domain Rules
- Search is workspace-scoped.
- Search respects permissions.
- Results are paginated.

### Tasks
- **API**
  - `GET /search?q=...`
- **Search Targets**
  - projects
  - tasks
  - comments
  - members
- **Implementation Options**
  - start with MySQL LIKE/full-text
  - later use Meilisearch/Algolia if needed
- **Tests**
  - finds workspace data
  - cross-workspace data hidden
  - permission-restricted results hidden

## Feature 17.2 â Task Search

### API
- `GET /tasks/search?q=...`

### Domain Rules
- Search title and description.
- Support filters with search.

---
