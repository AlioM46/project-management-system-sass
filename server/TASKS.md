# Chat Application Sprint Tasks

## 1. Edit & Delete Messages
### Backend (Laravel)
- [x] Create routes for editing and deleting messages: `PUT /messages/{id}` and `DELETE /messages/{id}`.
- [x] Implement authorization checks (only the message sender can edit or delete).
- [x] On delete, remove attachment database records and delete physical files from storage/R2.
- [x] Broadcast real-time `MessageUpdated` and `MessageDeleted` events.

### Frontend (React)
- [x] Add "Edit" and "Delete" actions to user's own message context/hover menu.
- [x] Enable inline editing mode within the message composer/textarea.
- [x] Listen to real-time update/delete socket events and update active chat message state instantly.

---

## 2. Messages Scroll & Pagination
### Backend (Laravel)
- [x] Configure message query sorting by `created_at` descending and limit page size to `30`.
- [x] Filter out deleted-for-me messages using `whereDoesntHave('deletions')` logic.
- [x] Return standard Laravel pagination envelope with page metadata.

### Frontend (React)
- [x] Manage `currentPage` and `hasMoreMessages` state hooks in active conversation page container.
- [x] Reverse descending database outputs to render chronologically (oldest-to-newest).
- [x] Intercept top-scrolling scroll events (`scrollTop <= 10`) to fetch next pages of older messages.
- [x] Implement scroll anchoring to measure scroll differences and prevent screen layout jumping.
- [x] Build a floating indicator button `"New Messages ↓"` with a count badge for scrolled-up incoming message states.

---

## 3. Message Search
### Backend (Laravel)
- [x] Add keyword filtering support to the message list endpoint.

### Frontend (React)
- [x] Add a search button in the chat header to toggle a search input bar.
- [x] Filter messages dynamically and auto-scroll to the matched message with highlight effects.

---

## 4. Voice Messages
### Frontend (React)
- [x] Add a microphone recorder button inside the chat composer bar.
- [x] Record voice notes locally in `audio/webm` or `audio/mp3` formats using the browser's `MediaRecorder API`.
- [x] Render a recording duration timer with cancel and confirm/send options.
- [x] Construct `FormData` and upload raw audio file to backend.
- [x] Render custom voice player card with wave representation and audio playback controls.

### Backend (Laravel)
- [x] Handle uploaded audio files, store in S3 R2/local storage, and save with `audio/` mime types.

---

## 5. Chat Info Sidebar
### Frontend (React)
- [x] Build a collapsible right sidebar panel toggled by clicking the conversation header name or info button.
- [x] Render shared attachments categorized by Media (images/videos/voice notes) and Documents.
- [x] List group members with search, role badges (Owner/Admin/Member), and live online status indicators.
- [x] Render "Groups in Common" section for Direct Messages.

### Backend (Laravel)
- [x] Add `attachments()` HasManyThrough relationship in Conversation model.
- [x] Create `/api/v1/workspaces/{workspaceId}/chat/conversations/{id}/info` endpoint for sidebar data.

---

## 6. Conversation & Group Management Controls
### Backend (Laravel)
- [X] **Add / Remove Group Members:** Add admin endpoints to invite workspace users (`POST /participants`) and remove members (`DELETE /participants/{userId}`).
- [X] **Change User Role:** Add admin endpoints to change user role (`PUT /participants/{userId}/role`).
- [X] **Change Group Name & Description:** Add `description` column to `conversations` table and update endpoint (`PUT /conversations/{id}`).
- [X] **User Text Status:** Add `custom_status` column to `users` profile table with update endpoint (`PUT /auth/profile/status`).

- [x] **Clear Chat History:** Add endpoint (`POST /conversations/{id}/clear`) to soft-delete/hide message history for current user.
- [x] **Delete Conversation:** Add endpoint (`DELETE /conversations/{id}`) to remove conversation entry from user's active list.

- [x] **Mute Conversation:** Add `muted_until` column and endpoint (`POST /conversations/{id}/mute`).
- [x] **Starred Messages:** Add `starred_messages` pivot table with endpoints (`POST /messages/{id}/star` and `GET /conversations/{id}/starred`).
- [x] **Block Contact:** Create `blocked_users` table with endpoints (`POST /users/block` and `DELETE /users/unblock/{userId}`).

### Frontend (React)
- [X] **Member Management UI:** Add "+ Add Member" modal, "Remove Member" action, and role toggles inside Members list.
- [C] **Group Details Edit:** Add inline edit inputs for Group Name and Group Description in sidebar profile banner.
- [X] **User Status Display:** Render user's custom text status below display name in profile banner.
- [x] **Clear Chat Confirmation:** Add modal to confirm clearing chat history with instant UI cleanup.
- [x] **Delete Conversation Action:** Add confirmation modal to remove conversation and redirect to empty state.
- [x] **Mute Toggle & Duration Modal:** Wire Mute button with duration selection (15m, 1h, 8h, 24h, 1w, Forever).
- [x] **Starred Messages UI & Tab:** Add Star/Unstar action to message popover menu and dedicated Starred Messages tab in sidebar.
- [x] **Block Contact Banner:** Wire Block button for DMs with status banner ("You have blocked this contact") and Optimistic UI updating.

- [ ] **Custom Chat Theme/Wallpaper:** Add wallpaper selection picker in sidebar to personalize chat background.

---

## 7. Pin Messages
### Backend (Laravel)
- [x] Add `is_pinned` boolean column to `messages` table.
- [x] Implement toggle endpoint to pin/unpin a message and broadcast the updated status globally.

### Frontend (React)
- [x] Add "Pin" option to message context menus.
- [x] Display active pinned messages in a floating banner at the top of the chat area.

---

## 8. User Mentions (@Mentions)
### Frontend (React)
- [X] Display auto-complete user list popover when typing `@` in the text area.
- [X] Format and highlight mentioned names with custom color styles inside bubbles.

### Backend (Laravel)
- [X] Scan message body for `@username` patterns and dispatch prioritized push notifications.

---

## 9. Markdown & Code Formatting
### Frontend (React)
- [ ] Parse basic Markdown tags in message bubbles (bold `*text*`, italic `_text_`).
- [ ] Support multiline code block highlight wrappers (using ` ``` ` syntax).

---

## 10. Read Receipts (Sent, Delivered, Read Ticks)
### Backend (Laravel)
- [x] Track message status (sent, delivered, read) and broadcast receipt changes.

### Frontend (React)
- [x] Render a single grey checkmark when message is successfully sent to server.
- [x] Render double grey checkmarks when message is delivered to the recipient's browser.
- [x] Render double blue checkmarks when the recipient active-reads the conversation.

---

## 11. GIF Search Integration
### Frontend (React)
- [ ] Embed a searchable GIF panel (via Giphy or Tenor API) inside emoji/attachments picker.
- [ ] Send chosen GIFs as media attachment messages.

---

## 12. Pinned Conversations (Sidebar)
### Backend (Laravel)
- [x] Add a favorites database attribute or relation to track pinned sidebar chats.

### Frontend (React)
- [x] Add context actions to pin/favorite conversations.
- [x] Position pinned chats persistently at the top of the sidebar list.


1. 🔥 WebRTC Audio & Video Calling (Difficulty: 10/10 — HARDEST)
What it involves:
WebSockets Signaling: Outgoing ring, incoming ring overlay, Accept/Reject/Cancel call handlers.
P2P WebRTC Pipeline: Negotiating SDP offers/answers, ICE candidate exchange, handling STUN/TURN NAT traversal servers.
Media Stream Handling: Capturing local camera & mic streams, rendering remote video streams, mute microphone, toggle video camera, screen sharing, and call duration timers.
