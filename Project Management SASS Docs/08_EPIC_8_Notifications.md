# EPIC 8 â Notifications

## Epic Scope
Workspace-scoped in-app notifications and user notification preferences.

**Explanation:** Notifications are system-generated messages about events. They are not comments and not chat. They are read/unread records created by services.

## Feature 8.1 â Notification Engine

### User Story
As a user, I want to receive notifications for important workspace events.

### Services / Actions Used
- **Service:** `NotificationService`

### Domain Rules
- Notification belongs to workspace.
- Notification belongs to recipient user.
- Must support mark-as-read.
- Must support mark-all-as-read.
- Notifications should not leak cross-workspace data.

### Tasks
- **DB**
  - `notifications`:
    - id
    - workspace_id
    - recipient_user_id
    - type
    - title
    - body nullable
    - data JSON nullable
    - read_at nullable
    - timestamps
- **API**
  - `GET /notifications`
  - `PATCH /notifications/{id}/read`
  - `PATCH /notifications/read-all`
- **Tests**
  - notification created
  - mark read works
  - mark all read works
  - user sees own notifications only

## Feature 8.2 â Notification Preferences

### User Story
As a user, I want to control which notifications I receive.

### Services / Actions Used
- **Service:** `NotificationPreferenceService`

### Domain Rules
- Preferences unique per workspace + user.
- Preferences may control in-app, email, or both.

### Tasks
- **DB**
  - `notification_preferences`:
    - id
    - workspace_id
    - user_id
    - preferences JSON
    - timestamps
    - unique(workspace_id, user_id)
- **API**
  - `GET /notification-preferences`
  - `PUT /notification-preferences`
- **Tests**
  - preference update works
  - unique preference enforced

---
