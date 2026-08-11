# EPIC 7 â Collaboration (Comments & Mentions)

## Epic Scope
Task discussion through comments and mentions.

**Explanation:** This is comments, not chat. Comments are attached to tasks or optionally projects. Chat is a separate real-time messaging system and should not be mixed into task/project writes.

## Feature 7.1 â Comments

### User Story
As a member, I want to comment on a task so discussion stays connected to work.

### Services / Actions Used
- **Action:** `CreateComment`
- **Action:** `UpdateComment`
- **Action:** `DeleteComment`
- **Service:** `CommentService`
- **Service:** `AuthorizationService`

### Domain Rules
- Comment belongs to task.
- Task must belong to workspace.
- Author can delete own comment.
- Permission `comment.delete_any` can delete any comment.
- Optional: author can edit own comment within allowed rules.

### Tasks
- **DB**
  - `comments`:
    - id
    - workspace_id
    - task_id
    - author_user_id
    - body
    - edited_at nullable
    - timestamps
    - soft deletes
- **API**
  - `GET /tasks/{id}/comments`
  - `POST /tasks/{id}/comments`
  - `PATCH /comments/{id}`
  - `DELETE /comments/{id}`
- **Tests**
  - create comment
  - delete own comment
  - delete any with permission
  - cross-workspace blocked

## Feature 7.2 â Mentions

### User Story
As a member, I want to mention another member in a comment so they are notified.

### Services / Actions Used
- **Service:** `MentionParser`
- **Service:** `MentionService`
- **Service:** `NotificationService`

### Domain Rules
- Mentioned users must belong to workspace.
- Duplicate mentions prevented.
- Mention creates notification.
- Mention should not expose users from other workspaces.

### Tasks
- **DB**
  - `mentions`:
    - id
    - workspace_id
    - comment_id
    - mentioned_user_id
    - mentioned_by_user_id
    - timestamps
    - unique(comment_id, mentioned_user_id)
- **Implementation**
  - parse mentions from comment body
  - validate users
  - save mentions
  - create notifications
- **Tests**
  - mention workspace user
  - duplicate mention prevented
  - cross-workspace mention denied

---
