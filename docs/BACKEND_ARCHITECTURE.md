# Backend Architecture

## 1. Bounded Contexts (Domain-Driven Structure)
The application is strictly divided into Fine-Grained Bounded Contexts.
*   `identity/`: Users, Auth, Sessions.
*   `organizations/`: Companies, Branches, Teams.
*   `marketplace/`: Public Load Board (bids, tenders).
*   `freight/`: Core Operations (loads, shipments, tracking, exceptions).
*   `fleet/`: Asset Management (drivers, vehicles, equipment).
*   `documents/`: Metadata and extraction.
*   `finance/`: Settlements, Invoices, AP/AR.
*   `compliance/`: FMCSA, Insurance.
*   `notifications/`: In-app, Push, Email.
*   `integrations/`: Webhooks, EDI.

## 2. Advanced Authentication & Contexts
*   **Context Tokens**: Users receive a base JWT, but must request a specific Context Token (`/api/v1/auth/switch-context`) containing their `active_company_id` and specific roles for that session.
*   **Dedicated Permission Service**: Replaces strict JWT role checking. RBAC rules are evaluated, cached in Redis, and invalidated immediately if a user's role changes.

## 3. Transaction & Event Reliability
*   **Unit of Work (UoW)**: Ensures atomic business transactions (e.g., Accepting a bid updates the bid, creates the shipment, and generates the event in one commit).
*   **Outbox Pattern**: Domain Events are saved to `outbox_events` within the UoW transaction. A separate relay process reads this table and publishes to Kafka/Redis, guaranteeing "At-Least-Once" delivery.

## 4. API Separation
*   **Public APIs** (`/api/public/*`): Heavily rate-limited.
*   **Internal APIs** (`/api/v1/*`): Context-Token protected SPA endpoints.
*   **Partner APIs** (`/api/partner/v1/*`): Protected via API Keys and IP Whitelisting.
*   **Webhook APIs** (`/api/webhooks/*`): Validated via HMAC signatures.

## 5. Background Processing & Observability
*   **Celery Beat**: Schedules compliance checks, invoice reminders, and analytics generation.
*   **File Uploads**: 
    *   *Development*: Handled locally via direct FastAPI endpoint to the filesystem.
    *   *Production (Future)*: Backend generates AWS S3 Pre-Signed URLs; frontend uploads directly to S3.
*   **Observability**: JSON structured logging, `X-Request-ID` correlation IDs injected into all logs and Celery tasks, and Prometheus metrics.
