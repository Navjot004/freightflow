# Security Guidelines

## 1. Authentication & Authorization
*   **Stateless JWT**: Base tokens establish identity. Context Tokens establish authorization for a specific `company_id`.
*   **Context Isolation**: Every protected repository query must implicitly filter by `company_id`. This prevents Insecure Direct Object Reference (IDOR) attacks.
*   **Permission Refresh**: Role changes instantly invalidate cached permissions in Redis and revoke active Refresh Token families.

## 2. Data Protection
*   **In Transit**: TLS 1.2+ is strictly enforced for all API traffic and WebSocket connections.
*   **At Rest**: PostgreSQL databases must utilize disk-level AES-256 encryption.
*   **Secrets Management**: Database passwords, API keys, and JWT salts must never be hardcoded. They are injected via environment variables (`.env`) loaded from a secure secrets manager (e.g., AWS Secrets Manager).

## 3. Threat Mitigation
*   **Brute Force**: Endpoints under `/api/public/*` (specifically `/login`) are aggressively rate-limited using Redis.
*   **XSS & CSRF**: The React SPA escapes inputs by default to prevent XSS. APIs do not rely on cookies for auth (using Bearer tokens instead), mitigating CSRF risks.
*   **SQL Injection**: Strictly forbidden. SQLAlchemy ORM parameterized queries are mandatory. Raw SQL strings are prohibited unless explicitly reviewed and parameterized via `text()`.

## 4. File Upload Security
*   The backend never processes large binary files directly in production to prevent buffer overflows and DoS attacks.
*   **Production (Future)**: Pre-Signed S3 URLs are issued, delegating the security and bandwidth burden to cloud storage. Files are aggressively scanned for malware via S3 event triggers prior to being marked as `VERIFIED`.
*   **Development**: Direct local uploads are used temporarily.
