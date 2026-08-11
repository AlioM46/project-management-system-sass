# EPIC 26 â Email System and Templates

## Epic Scope
Transactional emails and reusable email templates.

**Explanation:** Notifications are in-app records. Emails are external delivery. Keep email templates centralized so product messaging stays consistent.

## Feature 26.1 â Email Templates

### Services / Actions Used
- **Service:** `EmailTemplateService`

### Domain Rules
- Templates should be reusable.
- Emails should be queued.
- Sensitive links must expire.

### Templates
- account verification
- password reset
- workspace invite
- mention notification
- task assignment
- billing receipt
- subscription cancelled

### Tasks
- Create mail classes.
- Create Blade email views.
- Queue email sends.
- Add tests for mail dispatch.

## Feature 26.2 â Email Preferences

### Services / Actions Used
- **Service:** `EmailPreferenceService`

### Domain Rules
- Some security emails cannot be disabled.
- Product notification emails may follow preferences.

### Tasks
- Connect email sending to notification preferences.

---
