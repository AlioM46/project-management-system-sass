# EPIC 21 â Webhooks and Integrations

## Epic Scope
Outgoing webhooks for external automation.

**Explanation:** Webhooks let other systems react when something happens in your SaaS. They must be signed, retried, and logged.

## Feature 21.1 â Webhook Endpoints

### Services / Actions Used
- **Action:** `CreateWebhookEndpoint`
- **Action:** `UpdateWebhookEndpoint`
- **Action:** `DeleteWebhookEndpoint`
- **Service:** `WebhookEndpointService`

### Domain Rules
- Endpoint belongs to workspace.
- Secret is generated and used for signing.
- Events are selected by subscription.

### Tasks
- **DB**
  - `webhook_endpoints`:
    - id
    - workspace_id
    - url
    - secret
    - events JSON
    - is_active
    - timestamps
- **API**
  - `GET /webhooks`
  - `POST /webhooks`
  - `PATCH /webhooks/{id}`
  - `DELETE /webhooks/{id}`

## Feature 21.2 â Webhook Delivery

### Services / Actions Used
- **Job:** `DeliverWebhook`
- **Service:** `WebhookDeliveryService`

### Domain Rules
- Deliveries are queued.
- Payloads are signed.
- Failed deliveries are retried.
- Delivery attempts are logged.

### Tasks
- **DB**
  - `webhook_deliveries`:
    - id
    - workspace_id
    - webhook_endpoint_id
    - event_type
    - payload JSON
    - status
    - attempts
    - last_error nullable
    - delivered_at nullable
    - timestamps
- **Events**
  - `task.created`
  - `task.updated`
  - `task.status_changed`
  - `comment.created`
  - `member.invited`
  - `project.deleted`
- **Tests**
  - delivery queued
  - signature generated
  - retry works

---
