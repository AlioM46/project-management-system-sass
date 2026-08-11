# EPIC 12 â Billing and Subscription

## Epic Scope
Workspace-level subscription billing, plans, invoices, and payment provider webhooks.

**Explanation:** Billing makes the app a SaaS business. Billing should belong to workspace, not individual user only, because the workspace consumes the product.

## Feature 12.1 â Plans

### User Story
As a visitor or admin, I want to see available plans.

### Services / Actions Used
- **Service:** `PlanService`

### Domain Rules
- Plans define price, interval, features, and limits.
- Plans can be active/inactive.

### Tasks
- **DB**
  - `plans`:
    - id
    - key unique
    - name
    - price_cents
    - currency
    - interval
    - features JSON
    - limits JSON
    - is_active
    - timestamps
- **API**
  - `GET /billing/plans`
- **Tests**
  - active plans returned
  - inactive plans hidden

## Feature 12.2 â Subscription Management

### User Story
As a workspace admin, I want to subscribe, upgrade, downgrade, cancel, or resume my plan.

### Services / Actions Used
- **Service:** `SubscriptionService`
- **Service:** `BillingProviderService`
- **Service:** `AuditLogger`

### Domain Rules
- Subscription belongs to workspace.
- Only authorized admins can manage billing.
- Subscription state must be synchronized with provider.

### Tasks
- **DB**
  - `subscriptions`:
    - id
    - workspace_id
    - provider
    - provider_customer_id
    - provider_subscription_id
    - plan_key
    - status
    - trial_ends_at nullable
    - current_period_starts_at nullable
    - current_period_ends_at nullable
    - cancelled_at nullable
    - timestamps
- **API**
  - `GET /billing/subscription`
  - `POST /billing/checkout`
  - `POST /billing/portal`
  - `POST /billing/change-plan`
  - `POST /billing/cancel`
  - `POST /billing/resume`
- **Tests**
  - create checkout session
  - cancel subscription
  - resume subscription
  - unauthorized user denied

## Feature 12.3 â Invoices

### Services / Actions Used
- **Service:** `InvoiceService`

### Domain Rules
- Workspace admins can view invoices.
- Invoice data comes from payment provider or local sync.

### Tasks
- **DB**
  - `invoices`:
    - id
    - workspace_id
    - provider_invoice_id
    - amount_cents
    - currency
    - status
    - hosted_invoice_url nullable
    - paid_at nullable
    - created_at
- **API**
  - `GET /billing/invoices`

## Feature 12.4 â Billing Webhooks

### Services / Actions Used
- **Action:** `HandleBillingWebhook`
- **Service:** `BillingWebhookService`
- **Service:** `SubscriptionService`
- **Service:** `AuditLogger`

### Domain Rules
- Webhooks must verify signature.
- Webhooks must be idempotent.
- Subscription state must be updated from provider event.

### Tasks
- **DB**
  - `billing_webhook_events`:
    - id
    - provider
    - provider_event_id unique
    - type
    - payload JSON
    - processed_at nullable
    - timestamps
- **API**
  - `POST /webhooks/stripe`
- **Tests**
  - invalid signature rejected
  - duplicate event ignored safely
  - subscription updated

---
