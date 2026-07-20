# Role-Based Access Control (RBAC) Matrix

## 1. Multi-Tenant Philosophy
FreightFlow enforces strict isolation. A User may have an `ADMIN` role in "Brokerage A" and a `DRIVER` role in "Carrier B". Permissions are strictly evaluated against the active Context Token's `company_id`.

## 2. Standard Roles & Capabilities

### Shipper Roles
*   **Shipper Admin**: Full control. Manage billing, invite users, view all company freight spend.
*   **Logistics Manager**: Can create loads, tender loads, and track shipments. Cannot modify billing.

### Broker Roles
*   **Broker Admin**: Manage margins, view all broker transactions, manage carrier network.
*   **Broker Agent**: Can bid on shipper loads, post loads to marketplace, and assign carriers. Restricted to viewing only the loads they manage.

### Carrier Roles
*   **Carrier Admin**: Full access. Manage fleet, verify compliance, bid on loads.
*   **Dispatcher**: Assign drivers and equipment to won shipments. Track live progress. Resolve exceptions.
*   **Driver**: Mobile-only access. Can view active shipments assigned to them, update tracking statuses, and upload PODs. No access to financial data.

### Owner-Operator
*   **Owner-Operator**: A hybrid role that can bid on the marketplace AND execute the shipment in the driver app.

### System Roles
*   **Platform Admin**: FreightFlow employees. Global read access. Can resolve disputes, verify FMCSA compliance, and suspend bad actors.

## 3. Permission Evaluation
Permissions are evaluated by the backend `PermissionService`, cached in Redis.
Example: `has_permission(user_id, company_id, "LOAD_CREATE")`.
