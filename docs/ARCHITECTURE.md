# System Architecture

## 1. High-Level Architecture Overview
FreightFlow utilizes a modern, decoupled Client-Server architecture designed for extreme scalability, modularity, and high availability.

### 1.1. Client Layer (Frontend)
*   **Framework**: React 18, structured as a Single Page Application (SPA).
*   **Build Tool**: Vite for rapid HMR and optimized production bundles.
*   **State Management**: Zustand (Global UI State) and React Query (Server Async State).
*   **Communication**: RESTful JSON API via Axios + WebSocket real-time updates.

### 1.2. Application Layer (Backend)
*   **Framework**: FastAPI (Python 3.10+), utilizing high-performance ASGI.
*   **Design Pattern**: Domain-Driven Design (DDD) with strictly separated Bounded Contexts.
*   **Data Validation**: Pydantic for rigid schema enforcement.
*   **Background Processing**: Celery workers backed by Redis for offloading heavy I/O operations (PDF generation, Emails).

### 1.3. Data Layer
*   **Primary Database**: PostgreSQL, fully normalized.
*   **ORM**: SQLAlchemy with Alembic for migrations.
*   **Event Sourcing**: Dedicated append-only `domain_events` table for CQRS capabilities and reliable audit trails.
*   **Object Storage**: Local file system (`/uploads`) for Development. AWS S3 (or compatible) for Production binary assets (Signatures, POD PDFs, Insurance documents).

### 1.4. Real-Time Layer
*   **WebSockets**: Fast API native WebSocket connections utilizing Redis Pub/Sub backends to broadcast tracking events and chat messages to specific browser clients without polling.

## 2. Core Architectural Principles
*   **Statelessness**: The backend maintains no session state. All requests are authenticated via JWT, allowing horizontal Pod autoscaling.
*   **The Outbox Pattern**: Ensures reliable event publishing from the Postgres database to the Message Broker (Redis/Kafka) to prevent data loss during network partitions.
*   **Unit of Work**: Ensures business logic executes atomically. Database transactions commit completely or rollback completely.

## 3. Infrastructure & Deployment Environments

### 3.1 Local Development (Current State)
*   **Frontend**: React + Vite running on local Node server.
*   **Backend**: FastAPI running locally via `uvicorn`.
*   **Data Stores**: PostgreSQL and Redis running locally (via Docker).
*   **File Storage**: Local filesystem uploads (`/uploads` directory).
*   **Real-time**: WebSockets running locally.

### 3.2 Production (Future State)
*   **Containerization**: Dockerized backend and frontend.
*   **Orchestration**: Target deployment on Kubernetes (EKS/GKE) or Managed Container Services (AWS ECS).
*   **Edge & Networking**: Load Balancer + CDN (Cloudflare or AWS CloudFront) for frontend caching.
*   **File Storage**: AWS S3 for secure, pre-signed URL binary asset storage.
*   **Observability**: Integrated structured logging, correlation IDs (`X-Request-ID`), and APM tracing.
