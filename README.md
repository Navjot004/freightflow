# 🚛 FreightFlow — Next-Gen Freight Management & Telematics Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.139.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet)](https://leafletjs.com/)

**FreightFlow** is an enterprise-grade Transportation Management System (TMS) and driver telematics portal built for **Shippers**, **Brokers**, **Carriers**, **Dispatchers**, **Drivers**, and **Super Admins**. It unifies load tendering, spot marketplace bidding, shipment execution, real-time GPS tracking, Hours of Service (HOS) ELD compliance, Proof of Delivery (POD) workflows, and platform administration into a single workspace.

---

## 🌟 Key Highlights & Portal Features

### 📱 1. Driver Portal & Mobile Execution
- **Dedicated Driver Interface**: Clean, driver-first UI engineered for clarity on mobile devices and touchscreens.
- **🗺️ Real-Time Navigation & OSRM Routing Engine**:
  - Live GPS tracking via HTML5 Geolocation & WebSockets.
  - **Dynamic Leg 1 Pathing**: Calculates and renders live driving routes from **Driver Current Location ➔ Pickup Facility (Origin)**.
  - **Dynamic Leg 2 Pathing**: Automatically switches to render live driving routes from **Driver Current Location ➔ Delivery Destination**.
  - Recalibrate GPS button to refresh position and route bounds.
- **⏱️ Hours of Service (HOS) & ELD Compliance**:
  - 11-Hour Driving Limit, 14-Hour On-Duty Shift Clock, and 70-Hour / 8-Day Duty Cycle tracking.
  - Interactive HOS Status Switcher (`DRIVING`, `ON_DUTY_NOT_DRIVING`, `SLEEPER_BERTH`, `OFF_DUTY`).
  - HOS Violation detector and rest break alerts.
- **📸 Proof of Delivery (POD) Lifecycle**:
  - Camera & document upload for PODs and Bills of Lading (BOL).
  - Clear multi-stage status separation:
    - **`POD_UPLOADED`**: Submitted & Pending Shipper / Broker Verification.
    - **`COMPLETED`**: Approved & Verified by Shipper (unlocks driver payout).

### 🏢 2. Shipper & Broker Marketplace
- **Load Creation & Tendering**: Create freight loads with origin/destination geocoding, cargo specs, weight, rate, and pickup/delivery windows.
- **Bidding & Spot Market**: Carriers bid on open loads; Shippers accept bids or tender directly to preferred partner carriers.
- **POD Review & Verification**: Review uploaded delivery documents and approve shipments for completion.

### 🚛 3. Carrier & Fleet Management
- **Fleet & Driver Directory**: Manage drivers, track availability (`AVAILABLE`, `ASSIGNED`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`), and monitor HOS status.
- **Multi-Criteria Search & Filtering**:
  - Global Search Input matching Driver Name, Email, Phone, or Fleet Manager.
  - **Searchable Fleet Manager Combobox Dropdown**: Embedded search input (`🔍 Search fleet manager...`) for quickly filtering dispatchers.
  - Filters for Driver Status and HOS Duty Status.
- **Dispatcher Assignment**: Easily assign or change Fleet Managers for drivers.

### 🛡️ 4. Super Admin Console
- **User Management Portal**: Complete overview of registered platform users.
- **Role Badging**: Explicit role visualization (`Super Admin`, `Shipper`, `Broker`, `Carrier`, `Dispatcher`, `Driver`, `Owner Operator`).
- **Advanced Filtering**: Filter users by Role, Status (`Active` / `Suspended`), or search by Name, Email, or Company Name.
- **Audit Logs & Dispute Resolution**: Platform analytics, company verification, and system audit logs.

---

## 🛠️ Technology Stack

| Component | Stack / Library | Description |
| --- | --- | --- |
| **Frontend Framework** | React 18, TypeScript, Vite | Fast SPA with typed state management |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Shadcn UI | Modern responsive glassmorphism aesthetic |
| **State & Routing** | Zustand, React Router v6 | Global state & multi-portal role routing |
| **Interactive Maps** | React Leaflet, OSRM API | Real-time GPS mapping & driving route geometry |
| **Backend API** | FastAPI, Python 3.12+ | High-performance async REST & WebSocket server |
| **Database & ORM** | PostgreSQL 16, SQLAlchemy 2.0, Alembic | Relational schema & migration management |
| **Real-time Telematics** | WebSockets, Redis | Low-latency driver position broadcasts |
| **Authentication** | JWT (JSON Web Tokens), Passlib (Bcrypt) | Secure role-based authorization |

---

## 📂 Project Structure

```text
FreightFlow/
├── backend/                        # FastAPI Application Server
│   ├── alembic/                    # Database migrations
│   ├── app/
│   │   ├── main.py                 # Application entrypoint & routes initialization
│   │   ├── core/                   # Security, JWT, DB session, & dependencies
│   │   └── domain/
│   │       ├── identity/           # User authentication, roles, & company models
│   │       ├── freight/            # Loads, shipments, tracking, & POD logic
│   │       ├── drivers/            # Driver profiles, assignments, & HOS engine
│   │       └── admin/              # Super admin analytics, audit logs, & company verification
│   └── tests/                      # Pytest test suites
│
├── frontend/                       # React 18 + Vite Application
│   ├── src/
│   │   ├── components/             # Reusable UI components (Table, Card, LiveTrackingMap)
│   │   ├── core/                   # Axios API client & WebSocket connections
│   │   ├── modules/
│   │   │   ├── admin/              # Super Admin pages (User Management, Audit Logs)
│   │   │   ├── shipments/          # Shipment execution, Driver Hero card, & POD modal
│   │   │   ├── drivers/            # Fleet directory, HOS widget, & manager combobox
│   │   │   ├── loads/              # Load board, bidding, & tendering
│   │   │   └── auth/               # Login, registration, & role guard routes
│   │   └── store/                  # Zustand global auth & UI state
│   ├── index.html
│   └── vite.config.ts
│
├── docs/                           # Architecture, API specifications, & guides
└── docker-compose.yml              # PostgreSQL 16 & Redis docker services
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.x or later & `npm`
- **Python**: v3.11 or v3.12+
- **Docker Desktop**: (Optional, for running local PostgreSQL & Redis)

---

### 1. Start Database & Infrastructure Services

If using Docker Compose:
```bash
docker compose up -d
```
*Starts PostgreSQL on port `5432` and Redis on port `6379`.*

---

### 2. Set Up & Run the Backend API

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a `.env` configuration file inside `backend/`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/freightflow
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=your-super-secret-key-change-in-production
   BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```
   *(Note: SQLite can also be used for quick local testing: `DATABASE_URL=sqlite:///./freightflow.db`)*

3. Create virtual environment & install dependencies:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

4. Run database migrations:
   ```bash
   alembic upgrade head
   ```

5. Start FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Server: `http://localhost:8000`
   - Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 3. Set Up & Run the Frontend Web App

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install NPM dependencies:
   ```bash
   npm install
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## ⚡ Core API Endpoints Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT bearer token |
| `POST` | `/api/auth/register` | Register new Shipper, Carrier, or Broker company |
| `GET` | `/api/loads/` | List loads (with role-based scope filtering) |
| `POST` | `/api/loads/` | Create a new load |
| `GET` | `/api/shipments/{id}` | Fetch shipment execution details & tracking history |
| `POST` | `/api/shipments/{id}/update-status` | Execute shipment stage transition |
| `POST` | `/api/shipments/{id}/pod` | Upload Proof of Delivery (POD) document |
| `GET` | `/api/drivers/` | List carrier drivers & fleet manager assignments |
| `POST` | `/api/drivers/` | Add a new fleet driver |
| `GET` | `/api/hos/{driver_id}/status` | Fetch driver HOS clocks & duty logs |
| `POST` | `/api/hos/{driver_id}/change-status` | Switch driver HOS duty status |
| `GET` | `/api/admin/users` | List all system users (Super Admin only) |
| `POST` | `/api/admin/users/{id}/toggle-status` | Suspend or activate a user account |
| `WS` | `/ws/live-tracking/{shipment_id}` | WebSocket stream for real-time driver GPS locations |

---

## 🧪 Testing & Verification

Run frontend TypeScript compilation & production build validation:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

Run backend test suite:
```bash
cd backend
pytest
```

---

## 📄 License & Documentation

- Comprehensive architecture guides can be found in the [`docs/`](docs/) directory:
  - [Architecture Overview](docs/ARCHITECTURE.md)
  - [Backend Architecture](docs/BACKEND_ARCHITECTURE.md)
  - [API Specification](docs/API_SPECIFICATION.md)
  - [Development Guide](docs/DEVELOPMENT_GUIDE.md)

Developed for **FreightFlow Logistics Platform**.
