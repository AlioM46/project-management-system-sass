# Feature Mapping Report: 30-Epic Docs vs. Current Codebase

This report maps the **30-Epic SASS Documentation** (found on your Desktop) against the active **`tasks-pm-clean`** branch. It identifies what has already been built, what is only implemented on the backend, and what is missing but would fit perfectly to complete your SaaS Project Management platform.

---

## 🗺️ High-Level Summary
Your codebase is structurally very solid, featuring a **Modular Monolith** architecture on the backend with clean service layers, and a responsive **Next.js client** on the frontend. 

* **Completed Core:** Authentication, Workspace Multi-Tenancy, Projects, Tasks (with a Kanban board), and Collaboration (Nested comments, file uploads, @mentions).
* **Next Logical Phase:** Bringing existing backend-only APIs (like RBAC, Audit export, and leaving workspaces) into the frontend UI, and building the SaaS billing & reporting layers.

---

## 🔍 Feature-by-Epic Breakdown

| Epic Reference | Feature & Scope | Codebase Status | How it Fits / Next Steps |
| :--- | :--- | :--- | :--- |
| **EPIC 1 & 15** | User Auth & Profile Settings | **Partially Implemented** | Login, registration, token refresh, and email verification are fully done. **Next:** Build the "Change Password", "Update Profile" (Name/Timezone/Locale), and "Upload Avatar" frontend settings in the client. |
| **EPIC 2** | Workspace Tenant Core | **Partially Implemented** | Workspace context middleware, tenant scoping, creation, and invitation workflows are complete. **Next:** Hook up the "Leave Workspace" button in the frontend (the backend API `POST /workspaces/current/leave` already exists). |
| **EPIC 3** | Authorization (RBAC) | **Backend-Only** | Role schemas, permission catalogs, and permission-gate middleware are complete on the backend. **Next:** Build an Admin UI screen to list roles (`/roles-permissions/roles`), customize custom role permissions (`PUT /roles-permissions/roles/{id}/permissions`), and sync defaults. |
| **EPIC 4 & 5** | Projects & Tasks Lifecycle | **Completed** | Full Kanban task board with filters, inline creation, task details modals, and project lists are functional. **Next:** Hook up the "Members" and "Settings" placeholder buttons in the Project Details view. |
| **EPIC 6** | Workflow Engine & History | **Partially Implemented** | Allowed status transition constraints (`getTaskTransitions`) are active. **Next:** Build a **Task History Component** inside the task details modal (the backend `task_history` table and tracker are already implemented; just needs a GET endpoint and UI panel). |
| **EPIC 7** | Collaboration & Mentions | **Completed** | Nested replies, comments with file attachments, and user search dropdowns for `@mentions` are fully integrated. |
| **EPIC 8** | Real-time Notifications | **Completed** | Pusher / Laravel Echo are integrated on the frontend, listening to workspace private channels. |
| **EPIC 9** | Audit Logging | **Partially Implemented** | Audits are tracked on the backend; the last 10 entries are listed in Workspace Settings. **Next:** Add search/filter inputs and audit logs page pagination. |
| **EPIC 11** | Reporting & Analytics | **Missing** | No reporting endpoints or analytics panels are built. **Highly Fits:** Adding an "Analytics" tab to the dashboard dashboard to show **Task Summary metrics** (total, open, done, blocked, overdue), **Member Workload charts**, and **Average Cycle Times**. |
| **EPIC 12 & 13** | Billing & Feature Gates | **Missing** | Stripe/Paddle webhook controllers, billing models, and usage limitation rules do not exist. **Highly Fits:** Adding subscription plan checkouts (`POST /billing/checkout`) and restricting free workspaces to limits like *max 3 projects*, *max 10 tasks*, or *max 5 members*. |
| **EPIC 17** | Global Workspace Search | **Missing** | Standard text discovery search across projects, tasks, and comments is missing. **Highly Fits:** Adding a global text search input in the Top Navigation bar that calls a new `/search?q=...` API. |
| **EPIC 18** | Queued Data Exports | **Backend-Only** | Backend has a CSV exporter. **Next:** Add a background queue job `GenerateTaskExport` and a "Download CSV" button on the Task Board and Settings. |
| **EPIC 20** | Personal Access Tokens | **Missing** | No developer token endpoints. **Fits:** Adding a "Developer Tokens" tab in Settings to generate API tokens for external integration. |

---

## 🚀 Recommended Immediate Roadmap

Based on what fits best to turn your current codebase into a commercial SaaS, here is the recommended priority order for the next features to implement:

### 🥇 Priority 1: Expose Existing Backend APIs in the UI (Low Effort / High Value)
1. **Roles & Permissions Admin Panel (Epic 3):** Expose the backend RBAC endpoints. Build a screen under settings where administrators can view workspace roles and customize permission checkboxes.
2. **Profile & Avatar Settings (Epic 15):** Build the personal profile settings UI (Change Password, update Name/Timezone, and upload Avatar).
3. **Leave Workspace & Members Actions (Epic 2):** Connect the project dashboard buttons (`Settings`, `Members`) and the workspace Settings `Leave Workspace` button to their respective backend API endpoints.

### 🥈 Priority 2: Analytics & Reporting (Medium Effort / High Value)
1. **Operational Metrics (Epic 11):** Implement the `TaskSummaryReport` API and add charts on the Dashboard overview to display task distributions, cycle times, and member workloads.
2. **Global Workspace Search (Epic 17):** Implement the search endpoint (`/search?q=...`) to let users query projects, tasks, and comments from the topbar search.

### 🥉 Priority 3: Commercialization & SASS Infrastructure (High Effort / Critical)
1. **Billing & Subscriptions (Epic 12):** Add Stripe/Paddle checkout/portal endpoints and set up webhook listeners.
2. **Entitlements & Gates (Epic 13):** Intercept creation requests (creating projects, creating tasks, inviting members) to block actions if the workspace exceeds its subscription plan limits.




## ### Handle Switching Workspaces.







###  Task 2: "Typing..." Indicators (Client Whispering)
### 
###  Trigger channel.whisper('typing', { isTyping: true }) on textarea change.
###  Add 1.5s inactivity timeout to automatically send isTyping: false.
###  Render "Someone is typing..." indicator in ChatMessageArea.tsx.
###  Task 3: Message Threading & Replies
### 
###  Add reply action button on message hover.
###  Pass replyId when sending a message and render reply quote block.
###  Task 4: Real-time Emoji Reactions
### 
###  Add emoji picker overlay to message items.
###  Broadcast reaction events over WebSockets and update UI state.
###  Task 5: File & Image Attachments
### 
###  Add file upload input to ChatMessageArea.tsx.
###  Store attachments on server and render image/document previews in message bubbles.
