# Development Guide

## 1. Local Environment Setup

### Prerequisites
*   Docker & Docker Compose
*   Python 3.10+
*   Node.js 18+

### Bootstrapping
1.  Clone the repository.
2.  Run `docker-compose up -d` to spin up PostgreSQL and Redis.
3.  **Backend**:
    *   Navigate to `/backend`.
    *   Create a virtual environment: `python -m venv venv`.
    *   Install dependencies: `pip install -r requirements.txt`.
    *   Run migrations: `alembic upgrade head`.
    *   Start server: `uvicorn app.main:app --reload`.
4.  **Frontend**:
    *   Navigate to `/frontend`.
    *   Install dependencies: `npm install`.
    *   Start Vite dev server: `npm run dev`.

## 2. Coding Standards
*   **Backend**: Adhere to `PEP 8`. Use `Black` for formatting and `Flake8` for linting. All functions must contain type hints.
*   **Frontend**: Adhere to `eslint-config-prettier`. Functional components only. Avoid deeply nested ternary operators in JSX.

## 3. Testing Strategy
*   **Backend**: `pytest` is used. Write tests targeting the Service layer (mocking Repositories) and the API layer (using FastAPI's `TestClient`). Run `pytest` before every commit.
*   **Frontend**: `vitest` for utility functions.

## 4. Git Workflow
*   Main branch: `main` (Production).
*   Development branch: `develop` (Staging).
*   Feature branches: `feature/short-description`.
*   Pull Requests require at least one approving review and a green CI pipeline before merging.
