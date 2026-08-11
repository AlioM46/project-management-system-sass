# EPIC 1 â Identity (Account & Authentication)

## Epic Scope
Global user account lifecycle and session authentication.
No workspace logic here. No tenant header.

**Explanation:** Identity answers: **Who is this user?** It must stay global because a user can belong to many workspaces. Do not mix workspace membership or permissions into authentication.

## Feature 1.1 â Account Registration

### User Story
As a visitor, I want to create an account so that I can access the platform.

### Services / Actions Used
- **Action:** `RegisterUser`
- **Service:** `AuthService`

### Domain Rules
- Email must be globally unique.
- Password must be hashed.
- Email must be normalized to lowercase.
- Do not leak whether an email already exists.

### Tasks
- **DB**
  - `users` table:
    - id
    - name
    - email unique
    - password
    - email_verified_at
    - timestamps
- **API**
  - `POST /auth/register`
- **Validation**
  - name required
  - email required + valid + unique
  - password required + confirmed + minimum length
- **Implementation**
  - `RegisterUser` calls `AuthService::register(...)`
- **Security**
  - hash password
  - normalize email
  - consistent error response
  - optional registration rate limit
- **Tests**
  - register success
  - duplicate email fails safely
  - password is hashed
  - email normalized

## Feature 1.2 â Login (Sanctum SPA Cookies)

### User Story
As a user, I want to login so that I can access protected endpoints.

### Services / Actions Used
- **Action:** `LoginUser`
- **Service:** `AuthService`

### Domain Rules
- Invalid credentials must not reveal whether email or password is wrong.
- Session fixation must be prevented.
- Login attempts must be rate-limited.

### Tasks
- **Setup**
  - Sanctum installed
  - CORS credentials enabled
  - `SANCTUM_STATEFUL_DOMAINS` configured
  - `/sanctum/csrf-cookie` works
- **API**
  - `POST /auth/login`
  - `GET /auth/me`
- **Implementation**
  - validate credentials
  - regenerate session after login
- **Security**
  - throttle login attempts
  - generic `401` response
- **Tests**
  - login success
  - login failure returns `401`
  - `/auth/me` returns `401` when unauthenticated

## Feature 1.3 â Logout

### User Story
As an authenticated user, I want to logout so that my session is terminated.

### Services / Actions Used
- **Action:** `LogoutUser`
- **Service:** `AuthService`

### Domain Rules
- Logout must invalidate the session.

### Tasks
- **API**
  - `POST /auth/logout`
- **Implementation**
  - invalidate session
  - regenerate CSRF token
- **Tests**
  - after logout, protected endpoint returns `401`

## Feature 1.4 â Password Reset

### User Story
As a user, I want to reset my password so that I can regain access.

### Services / Actions Used
- **Action:** `SendPasswordResetLink`
- **Action:** `ResetPassword`
- **Service:** `PasswordResetService`

### Domain Rules
- Do not reveal whether the email exists.
- Token must expire.
- Token must be single-use.
- Reset should invalidate previous sessions when possible.

### Tasks
- **API**
  - `POST /auth/password/forgot`
  - `POST /auth/password/reset`
- **Validation**
  - forgot: email required
  - reset: token + email + password + confirmation
- **Security**
  - rate limit forgot requests
  - generic success response
- **Tests**
  - forgot does not leak user existence
  - reset succeeds with valid token
  - reset fails with invalid/expired token
  - token cannot be reused

## Feature 1.5 â Email Verification

### User Story
As a user, I want to verify my email so that my account is trusted.

### Services / Actions Used
- **Action:** `SendEmailVerification`
- **Action:** `VerifyEmail`
- **Service:** `EmailVerificationService`

### Domain Rules
- Verification link must be signed.
- Verification link must expire.
- Sensitive actions may require verified email.

### Tasks
- **API**
  - `POST /auth/email/verification-notification`
  - `GET /auth/email/verify/{id}/{hash}`
- **Implementation**
  - generate signed URL
  - set `email_verified_at`
- **Tests**
  - valid verification marks user verified
  - invalid signature fails
  - expired link fails

## Feature 1.6 â Change Password

### User Story
As an authenticated user, I want to change my password so that I can improve security.

### Services / Actions Used
- **Action:** `ChangePassword`
- **Service:** `AuthService`

### Domain Rules
- Current password must be correct.
- New password must be confirmed.

### Tasks
- **API**
  - `PATCH /auth/password`
- **Validation**
  - current_password required
  - password required + confirmed
- **Tests**
  - wrong current password fails
  - change password succeeds

---
