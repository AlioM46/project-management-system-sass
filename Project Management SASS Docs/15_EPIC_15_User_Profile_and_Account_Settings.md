# EPIC 15 â User Profile and Account Settings

## Epic Scope
Personal user profile, email changes, avatar, timezone, locale, and account lifecycle.

**Explanation:** User settings belong to the global user account. They should not depend on workspace context unless the setting is workspace-specific.

## Feature 15.1 â Profile Update

### Services / Actions Used
- **Action:** `UpdateUserProfile`
- **Service:** `UserProfileService`

### Domain Rules
- User can update own profile.
- Name cannot be empty.

### Tasks
- **API**
  - `GET /account/profile`
  - `PATCH /account/profile`
- **Fields**
  - name
  - timezone
  - locale
- **Tests**
  - profile updated
  - cannot update another user

## Feature 15.2 â Email Change

### Services / Actions Used
- **Action:** `RequestEmailChange`
- **Action:** `ConfirmEmailChange`
- **Service:** `EmailChangeService`

### Domain Rules
- New email must be unique.
- New email should require verification.
- Do not immediately trust changed email until verified.

### Tasks
- **API**
  - `PATCH /account/email`
  - `POST /account/email/confirm`

## Feature 15.3 â Avatar

### Services / Actions Used
- **Service:** `AvatarService`
- **Service:** `StorageService`

### Domain Rules
- Validate file size/type.
- Replace old avatar safely.

### Tasks
- **API**
  - `POST /account/avatar`
  - `DELETE /account/avatar`

## Feature 15.4 â Account Deletion

### Services / Actions Used
- **Action:** `RequestAccountDeletion`
- **Service:** `AccountDeletionService`

### Domain Rules
- Cannot delete account if it would leave workspace without admin.
- Must handle ownership/membership rules.

### Tasks
- **API**
  - `DELETE /account`
- **Tests**
  - last admin cannot delete without transfer/removal flow

---
