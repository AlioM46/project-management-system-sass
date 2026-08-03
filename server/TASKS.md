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

## 2. Message Search
### Backend (Laravel)
- [ ] Add keyword filtering support to the message list endpoint.

### Frontend (React)
- [ ] Add a search button in the chat header to toggle a search input bar.
- [ ] Filter messages dynamically and auto-scroll to the matched message with highlight effects.

---

## 3. Voice Messages
### Frontend (React)
- [ ] Add a microphone recorder button inside the chat composer bar.
- [ ] Record voice notes locally in `audio/webm` or `audio/mp3` formats using the browser's `MediaRecorder API`.
- [ ] Render a recording duration timer with cancel and confirm/send options.
- [ ] Construct `FormData` and upload raw audio file to backend.
- [ ] Render custom voice player card with wave representation and audio playback controls.

### Backend (Laravel)
- [ ] Handle uploaded audio files, store in S3 R2/local storage, and save with `audio/` mime types.

---

## 4. Chat Info Sidebar
### Frontend (React)
- [ ] Build a collapsible right sidebar panel toggled by clicking the conversation header name.
- [ ] Render shared attachments categorized by Media (images/videos) and Documents.
- [ ] List group members and expose administrator controls to add or remove participants.

---

## 5. Pin Messages
### Backend (Laravel)
- [ ] Add `is_pinned` boolean column to `messages` table.
- [ ] Implement toggle endpoint to pin/unpin a message and broadcast the updated status globally.

### Frontend (React)
- [ ] Add "Pin" option to message context menus.
- [ ] Display active pinned messages in a floating banner at the top of the chat area.

---

## 6. User Mentions (@Mentions)
### Frontend (React)
- [ ] Display auto-complete user list popover when typing `@` in the text area.
- [ ] Format and highlight mentioned names with custom color styles inside bubbles.

### Backend (Laravel)
- [ ] Scan message body for `@username` patterns and dispatch prioritized push notifications.

---

## 7. Markdown & Code Formatting
### Frontend (React)
- [ ] Parse basic Markdown tags in message bubbles (bold `*text*`, italic `_text_`).
- [ ] Support multiline code block highlight wrappers (using ` ``` ` syntax).

---

## 8. Read Receipts (Sent, Delivered, Read Ticks)
### Backend (Laravel)
- [ ] Track message status (sent, delivered, read) and broadcast receipt changes.

### Frontend (React)
- [ ] Render a single grey checkmark when message is successfully sent to server.
- [ ] Render double grey checkmarks when message is delivered to the recipient's browser.
- [ ] Render double blue checkmarks when the recipient active-reads the conversation.

---

## 9. GIF Search Integration
### Frontend (React)
- [ ] Embed a searchable GIF panel (via Giphy or Tenor API) inside emoji/attachments picker.
- [ ] Send chosen GIFs as media attachment messages.

---

## 10. Favorite & Pinned Conversations (Sidebar)
### Backend (Laravel)
- [ ] Add a favorites database attribute or relation to track pinned sidebar chats.

### Frontend (React)
- [ ] Add context actions to pin/favorite conversations.
- [ ] Position pinned chats persistently at the top of the sidebar list.
