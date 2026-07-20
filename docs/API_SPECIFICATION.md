# API Specification

## 1. RESTful Standards
The API adheres to RESTful resource-oriented standards.
*   **Format**: JSON.
*   **Status Codes**: Use of standard HTTP codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
*   **Pagination**: All listing endpoints utilize `limit` and `offset` query parameters.

## 2. API Gateway Separation
The backend exposes different API gateways tailored for distinct consumers.

### 2.1 Public APIs (`/api/public/v1/*`)
Endpoints accessible without authentication.
*   `POST /auth/login`: Issue Base JWT.
*   `POST /auth/register`: Create new user/company.
*   `POST /auth/forgot-password`: Trigger reset flow.

### 2.2 Internal APIs (`/api/v1/*`)
Used exclusively by the React SPA. Requires a valid JWT Context Token.
*   `GET /auth/switch-context`: Retrieve a context token for a specific company.
*   `GET /loads/marketplace`: Fetch available loads on the public board.
*   `POST /bids`: Place a bid.
*   `PATCH /shipments/{id}/status`: Driver updates shipment state.
*   `POST /documents/upload-url`: Request an upload URL (Local endpoint for Dev, S3 Pre-Signed URL for Prod).

### 2.3 Partner APIs (`/api/partner/v1/*`)
Used for B2B system integration (e.g., external TMS).
*   Secured via `X-API-Key` headers.
*   Enforces strict IP whitelisting.

### 2.4 Webhook APIs (`/api/webhooks/*`)
Endpoints that receive asynchronous pushes from external services (e.g., Stripe, ELDs).
*   Secured via HMAC signature validation.

## 3. WebSockets
Real-time connections established at `/ws`.
*   Namespace `/ws/company/{id}`: Global company alerts.
*   Namespace `/ws/shipment/{id}`: Live tracking breadcrumbs for an active dispatch.
