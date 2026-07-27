# 🚛 FreightFlow — Next-Gen Freight Management & Telematics Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.139.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![NeonDB](https://img.shields.io/badge/Neon_Serverless-PostgreSQL-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)

**FreightFlow** is an enterprise-grade Transportation Management System (TMS) and driver telematics portal built for **Shippers**, **Brokers**, **Carriers**, **Dispatchers**, **Drivers**, and **Super Admins**. It unifies multi-tier load tendering, spot marketplace bidding, shipment execution, 1-hop partner privacy masking, real-time GPS tracking, Hours of Service (HOS) ELD compliance, Proof of Delivery (POD) workflows, and platform administration into a single workspace.

---

## 🌟 Key Highlights & Portal Features

### 💵 1. Multi-Tier Broker Margin & Financial System
- **3-Tier Financial Rate Hierarchy**:
  - **`shipper_rate`**: Gross contract rate paid by Shipper to Broker (e.g., $2,500).
  - **`carrier_rate`**: Buy rate paid by Broker to Carrier (e.g., $2,000; Broker retains $500 margin).
  - **`partner_rate`**: Subcontracted rate paid by Prime Carrier to Owner-Operator (e.g., $1,800).
- **Live Margin Calculators**: Real-time margin indicators embedded in Partner Assignment & Tender modals (`Margin: $2,500 - $2,000 = $500 (20.0%)`).
- **Multi-Relationship Invoicing**: Automated invoice rate selection for `BROKER_TO_SHIPPER`, `CARRIER_TO_BROKER`, and `OWNER_OPERATOR_TO_CARRIER`.

### 🛡️ 2. 1-Hop Partner Masking (Disintermediation Protection)
- **Partner Abstraction**: When a Carrier or Driver views a brokered shipment, original Shipper corporate identity is masked as `"Client (via [Broker Name])"` and corporate contact details are hidden.
- **Financial Rate Masking**:
  - **Carrier / Driver View**: Hides Shipper contract rates and Broker gross margins.
  - **Subcontractor View**: Hides Prime Carrier contract rates.
  - **Shipper View**: Hides Carrier/Partner buy rates.

### 📅 3. Confidential Facility Appointments & Contacts Engine
- **Full Leg Execution Details**:
  - **Pickup Facility**: Appointment Date & Time, Contact Person & Phone, Dock/Bay #, Reference/PU #, Special Instructions.
  - **Delivery Facility**: Appointment Date & Time, Contact Person & Phone, Dock/Bay #, Delivery Ref/PO #, Special Instructions.
- **Role-Aware Security**: Full details exposed to authorized execution parties; public marketplace search masks contact details prior to booking.
- **High-Visibility UI Cards**: Embedded in `LoadDetailsPage`, `ShipperShipmentDetailsView`, `DriverHeroCard`, and `DriverFacilityCard`.

### 🗺️ 4. Real-Time GPS Telematics & Route Navigation Engine
- **Strict Driver Telematics Calibration**:
  - **Assigned Driver Location Only**: Live location maps strictly display the assigned driver's real-time GPS signal (`livePoint`, `trackingHistory`, or `shipment.current_location`).
  - **Unassigned Driver Map State**: Disables browser HTML5 geolocation fallback for dispatchers/managers, preventing false truck marker movement across the map. Displays an **"Awaiting Driver Assignment"** banner state.
- **Dynamic OSRM Route Navigation**:
  - **Leg 1 Pathing**: Driver Current Location ➔ Pickup Facility (Origin).
  - **Leg 2 Pathing**: Driver Current Location ➔ Delivery Destination.
- **Direct WebSocket Broadcast**: High-speed `/ws/shipment/{id}` telematics stream for zero-latency vehicle position updates.

### 🔒 5. Role-Based Access Control & Dispatcher Scoping
- **Dedicated Dispatcher Scope**: Restricts `DISPATCHER` users from Marketplace load bidding, Tender management, and Invoices & Financials.
- **Active Shipments Sorting**: Chronological default sorting (`created_at` DESC) ensuring new loads and shipments appear at the top of lists by default across all views.

### 📱 6. Driver Portal & Mobile Execution
- **Dedicated Mobile Interface**: Clean UI built for high-touch operational controls.
- **⏱️ Hours of Service (HOS) & ELD Compliance**:
  - 11-Hour Driving Limit, 14-Hour Shift Clock, and 70-Hour / 8-Day Duty Cycle tracking.
  - HOS Duty Status Switcher (`DRIVING`, `ON_DUTY_NOT_DRIVING`, `SLEEPER_BERTH`, `OFF_DUTY`).
- **📸 Proof of Delivery (POD) & Verification Workflow**:
  - Camera & document upload for PODs and Bills of Lading (BOL).
  - One-click Shipper **Approve POD & Complete Shipment** or **Reject POD & Open Dispute** control cards.

### 🏢 7. Shipper & Broker Marketplace
- **Load Creation & Tendering**: Create freight loads with origin/destination geocoding, cargo specs, weight, rate, and pickup/delivery windows.
- **Bidding & Spot Market**: Carriers & Owner Operators bid on open loads; Shippers/Brokers accept bids or tender directly to preferred partner carriers.

### 🚛 8. Carrier & Fleet Management
- **Fleet Directory & Driver Allocation**: Manage drivers, track availability (`AVAILABLE`, `ASSIGNED`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`), and monitor HOS status.
- **Searchable Fleet Manager Combobox Dropdown**: Embedded search input (`🔍 Search fleet manager...`) for quick dispatcher selection.

### 🛡️ 9. Super Admin Console
- **User Management Portal**: Complete overview of registered platform users and role badging.
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
| **Database & ORM** | Neon Serverless PostgreSQL / SQLite, SQLAlchemy 2.0 | Relational schema & declarative ORM model management |
| **Real-time Telematics** | WebSockets, Redis | Low-latency driver position broadcasts |
| **Authentication** | JWT (JSON Web Tokens), Passlib (Bcrypt) | Secure role-based authorization |

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.x or later & `npm`
- **Python**: v3.11 or v3.12+
- **Database**: Local PostgreSQL or Neon PostgreSQL Cloud URI

---

### 1. Set Up & Run the Backend API

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create virtual environment & install dependencies:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. Set up `.env` inside `backend/`:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<neon-hostname>/<dbname>?sslmode=require"
   SECRET_KEY="your-super-secret-key-change-in-production"
   ```

4. Start FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Server: `http://localhost:8000`
   - Swagger Documentation: `http://localhost:8000/docs`

---

### 2. Set Up & Run the Frontend Web App

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
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
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT bearer token |
| `POST` | `/api/v1/auth/signup` | Register new Shipper, Carrier, Broker, or Owner Operator |
| `GET` | `/api/v1/loads/` | List loads (with role-based scope filtering) |
| `GET` | `/api/v1/loads/marketplace` | Browse open marketplace loads |
| `GET` | `/api/v1/loads/{id}` | Get detailed load info & confidential facility appointments |
| `POST` | `/api/v1/shipments/{id}/assign-partner` | Assign partner with offered pay rate & agreed margin |
| `POST` | `/api/v1/shipments/{id}/approve-pod` | Shipper one-click POD approval & shipment completion |
| `POST` | `/api/v1/shipments/{id}/reject-pod` | Shipper POD rejection & dispute initiation |
| `GET` | `/api/v1/shipments/me` | Fetch shipment execution details with partner masking (ordered by `created_at` DESC) |
| `GET` | `/api/v1/hos/{driver_id}/status` | Fetch driver HOS clocks & duty logs |
| `WS` | `/ws/shipment/{shipment_id}` | WebSocket stream for real-time driver GPS locations |

---

## 🧪 Testing & Verification

Run backend test suites (Loads marketplace, POD workflow, multi-tier margins, partner masking, appointment visibility):
```bash
cd backend
.\venv\Scripts\python -m pytest tests/test_loads.py tests/test_pod_workflow.py tests/test_margin_and_masking.py tests/test_appointment_visibility.py
```

Run frontend TypeScript compilation & build check:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

Developed for **FreightFlow Logistics Platform**.
