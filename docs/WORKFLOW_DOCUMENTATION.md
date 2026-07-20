# Workflow Documentation

## 1. Freight Lifecycle Workflow
This is the core standard operating procedure for moving freight on the platform.

### Phase 1: Origination
1.  Shipper logs in and creates a `Load` detailing origin, destination, weight, and equipment needs.
2.  The Load enters the `DRAFT` state.
3.  Shipper publishes the Load. They can:
    *   **Tender**: Send directly to a preferred Carrier/Broker (`TENDERED` state).
    *   **Post**: Push to the public Marketplace (`AVAILABLE` state).

### Phase 2: Negotiation & Bidding
1.  Carriers view the Marketplace and submit `Bids`.
2.  Shipper reviews bids and accepts the optimal one.
3.  The Load moves to `COVERED`.
4.  The system automatically generates a `Shipment` record linked to the Load and assigns it to the winning Carrier.

### Phase 3: Execution (Shipment Lifecycle)
1.  Carrier Dispatcher views the `Shipment` (Status: `PLANNED`).
2.  Dispatcher assigns a `Driver` and `Vehicle`.
3.  Dispatcher sets status to `DISPATCHED`.
4.  Driver opens the mobile app, views the active shipment.
5.  Driver updates status: `AT_PICKUP` -> `IN_TRANSIT` -> `AT_DELIVERY`.
6.  Throughout transit, background processes ingest GPS tracking points to update ETAs.

### Phase 4: Delivery & Documents
1.  At delivery, the Driver captures the receiver's digital signature.
2.  Driver logs any Over, Short, and Damaged (OS&D) exceptions.
3.  Driver marks shipment as `DELIVERED`.
4.  Backend generates a final, unalterable PDF Proof of Delivery (POD).

### Phase 5: Settlement
1.  The `DELIVERED` event triggers the Finance module.
2.  An `Invoice` is generated and sent to the Shipper.
3.  A `Settlement` is queued for the Carrier.
4.  Once paid, the Load and Shipment are marked `COMPLETED`.
