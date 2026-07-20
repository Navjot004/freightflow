# Database Architecture & Entity Relationship Design

## 1. Core Principles
*   **Relational Integrity**: PostgreSQL is the primary store. Strict foreign key constraints and `CASCADE`/`RESTRICT` rules are enforced.
*   **Data Lifecycle**: Implementation of `deleted_at` timestamps for Soft Deletes on commercial entities (`loads`, `shipments`, `invoices`).
*   **Event Sourcing**: Use of an append-only `domain_events` table tracking all major state changes.

## 2. The 11 Bounded Domains

### 2.1 Identity, Auth & Driver Separation
*   `users`: Core app access (`email`, `password_hash`).
*   `company_users`: Multi-tenant mapping table (`user_id`, `company_id`, `role_id`).
*   `drivers`: Physical worker profiles. Tied to a Carrier company, optionally tied to a `user_id`.

### 2.2 Workflow Engine
*   `workflow_definitions`: Defines rules and trigger events.
*   `workflow_states`: Defines allowed state transitions.
*   `workflow_executions`: Tracks the current state of a specific entity (e.g., a Load).

### 2.3 Improved Location Model
*   `locations`: Master registry (`lat`, `lng`, `geofence_radius_meters`, `timezone`).
*   `location_facilities`: Details like operating hours and dock doors.

### 2.4 Freight Lifecycle (Commercial Demand)
*   `loads`: The commercial request (`status`: DRAFT, AVAILABLE, COVERED, IN_EXECUTION, FULFILLED, BILLED).
*   `load_stops`: Pickups, deliveries, and appointment windows.

### 2.5 Shipment Lifecycle (Physical Execution)
*   `shipments`: The physical movement (`status`: PLANNED, DISPATCHED, AT_PICKUP, IN_TRANSIT, DELIVERED).
*   `tracking_events`: High-volume GPS breadcrumbs.
*   `exceptions`: Delays, breakdowns, and OS&D logs.

### 2.6 Equipment Hierarchy
*   `equipment_types`: Master classification (Dry Van, Flatbed).
*   `vehicles` / `trailers`: Distinct assets with specific dimensions and attributes.

### 2.7 Better Document Architecture
*   `documents`: Core file metadata.
*   `document_metadata`: Extracted OCR data (signatures, amounts).
*   `document_templates`: Layouts for generating PDFs.

### 2.8 Partnership Preferences
*   `partnerships`: Verified links between companies.
*   `partnership_preferences`: Auto-tender rules, default margins, priority levels.

### 2.9 Finance Settlement Model
*   `financial_accounts`: AR/AP ledgers per company.
*   `invoices`: Sent to Shippers.
*   `settlements`: Paid out to Carriers.
*   `settlement_line_items`: Linehaul, fuel surcharges, lumper advances, deductions.

### 2.10 Domain Events
*   `domain_events`: `aggregate_id`, `event_type`, `payload`, `occurred_at`. Supports Outbox Pattern publishing.

### 2.11 Integration Architecture
*   `api_keys`: For partner API access.
*   `webhooks`: Target URLs and subscribed event arrays.
*   `edi_configurations`: ISA routing details for X12 formats (204, 214, 210).

## 3. Indexing & Scalability
*   **Spatial**: PostGIS `GIST` indexes on `locations(lat, lng)`.
*   **Time-Series**: Declarative partitioning on `tracking_events` by `occurred_at`.
