# FreightFlow

FreightFlow is a freight operations portal for shippers, carriers, dispatchers, and drivers. It brings load management, tendering, shipment execution, live tracking, compliance workflows, and driver hours-of-service planning into one workspace.

## Highlights

- Role-based dashboards for company, driver, owner-operator, and admin users
- Load creation, tendering, bidding, assignment, and shipment execution
- Driver workflow with HOS status and next-leg planning
- Location tracking and WebSocket-powered live updates
- Proof-of-delivery, document uploads, and appointment scheduling
- Compliance, finance, disputes, ratings, partnerships, and notifications

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Zustand, React Router |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| Real time | FastAPI WebSockets and Redis |
| Data services | PostgreSQL and Redis via Docker Compose |
| Background work | Celery and APScheduler |

## Project Structure

```text
freightflow/
├── backend/            FastAPI application, migrations, domain services, tests
├── frontend/           React and Vite application
├── docs/               Product, architecture, API, and development documentation
└── docker-compose.yml  Local PostgreSQL and Redis services
```

## Quick Start

### Prerequisites

- Node.js current LTS and npm
- Python 3.11 or later
- Docker Desktop with Docker Compose

### 1. Start local services

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

### 2. Configure and run the backend

Create `backend/.env` with local values. The backend reads `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, and `BACKEND_CORS_ORIGINS` from this file.

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/freightflow
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=replace-with-a-local-secret
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Activate your Python environment, install backend dependencies, run migrations, then start the API from the `backend` directory:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

> The default config supports SQLite (`sqlite:///./freightflow.db`) for a quick local run. Use the PostgreSQL URL above when running with Docker Compose services.

The API is available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

### 3. Run the frontend

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. During local development, Vite proxies `/api` and `/ws` to the backend.

## Development Commands

```bash
# Frontend
cd frontend
npm ci
npm run lint
npm run build

# Backend
cd backend
pytest tests
alembic upgrade head
```

For ad-hoc API integration checks, `backend/test_auth_local.py` and `backend/test_hos.py` expect a running backend on `http://localhost:8000`.

## Environment and Local Files

Local environment files, databases, uploaded documents, generated diagnostics, dependencies, and editor settings are ignored by Git. Do not commit credentials or production secrets. The default settings are appropriate only for local proof-of-concept use.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [API Specification](docs/API_SPECIFICATION.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Project Specification](docs/PROJECT_SPECIFICATION.md)

## License

This repository does not currently declare a license.
