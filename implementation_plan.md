# Phase B — Finance Implementation Plan

This document outlines the architectural changes, API endpoints, and frontend modules required to implement the comprehensive Finance phase (Phase B) of FreightFlow.

## User Review Required

> [!WARNING]
> This is a significant architectural addition. Please review the **Proposed Changes** below, specifically the data flow for Invoices vs. Settlements, and confirm if the proposed architecture aligns with your business logic.

## Open Questions

> [!IMPORTANT]
> 1. **Payments Integration:** For recording payments against Invoices/Settlements, are we mocking the payment gateway (e.g., Stripe/Plaid) or just creating internal manual payment recording endpoints?
> 2. **Invoice Generation:** Should the system automatically generate a Draft Invoice when a shipment is marked `DELIVERED`, or will this be a manual user action?
> 3. **Profit & Loss Logic:** For P&L, should we calculate this purely based on Paid Invoices minus Paid Settlements, or based on Accrual accounting (Issued Invoices minus Approved Settlements)?

## Proposed Changes

---

### Database Schema Updates (Backend)

We already have basic models for `FinancialAccount`, `Invoice`, and `Settlement`. We need to expand them to support transactions and payments.

#### [NEW] `app/domain/finance/models.py` (Extensions)
- **`LedgerTransaction`**: A model to record double-entry or single-entry ledger changes (Debit/Credit) affecting a `FinancialAccount`.
- **`PaymentRecord`**: A model linking a payment (incoming or outgoing) to a specific Invoice or Settlement, including payment method, reference ID, and amount.
- **`Charge`**: A standardized model linked to a `Load` or `Shipment` representing Base Rate, Fuel Surcharge, and Accessorials.

---

### Backend API Endpoints (Finance Domain)

We will expand `app/domain/finance/router.py` and `service.py` with the following:

#### [MODIFY] `app/domain/finance/router.py`
- **GET `/finance/ledger`**: Retrieve the company's current AR (Accounts Receivable) and AP (Accounts Payable) balances.
- **GET `/finance/ledger/transactions`**: Retrieve the transaction history (Ledger).
- **POST `/finance/charges`**: Add accessorial charges or update base rates for a load/shipment.
- **POST `/finance/invoices/{id}/issue`**: Mark a draft invoice as ISSUED.
- **POST `/finance/invoices/{id}/pay`**: Record an incoming payment against an invoice, automatically updating the AR ledger.
- **POST `/finance/settlements/{id}/pay`**: Record an outgoing payment against a settlement, updating the AP ledger.
- **GET `/finance/pnl`**: Aggregate revenue (invoices) vs. expenses (settlements/carrier pay) over a time period.

---

### Frontend Modules (React)

We will introduce a new top-level navigation item: **Finance Dashboard** with several sub-pages.

#### [NEW] `src/modules/finance/pages/FinanceDashboardPage.tsx`
- A high-level overview showing AR/AP balances, recent transactions, and a Profit & Loss graph.

#### [NEW] `src/modules/finance/pages/InvoicingPage.tsx`
- A table to view all Invoices (Draft, Issued, Paid, Overdue).
- Actions to Generate PDF, Issue Invoice, and Record Payment.

#### [NEW] `src/modules/finance/pages/SettlementsPage.tsx`
- A table to view all Settlements to carriers/owner-operators.
- Actions to Approve Settlement and Record Payout.

#### [NEW] `src/modules/finance/pages/LedgerPage.tsx`
- A detailed view of the company's financial ledger (Customer Accounts), showing all debits and credits chronologically.

#### [MODIFY] `src/components/layout/DashboardLayout.tsx`
- Add "Finance" to the sidebar navigation for users with appropriate roles (e.g., `COMPANY_ADMIN`, `BROKER_OPS`, `SHIPPER_OPS`).

## Verification Plan

### Automated Tests
- N/A for this sprint (we are rapidly prototyping), but will rely on strict Pydantic schema validations.

### Manual Verification
1. **Ledger Accuracy:** Manually complete a load workflow, generate an invoice, record payment, and verify the AR balance increases correctly.
2. **Settlements:** Verify that completing a carrier assignment generates a draft settlement, and paying it reduces the AP balance.
3. **P&L Display:** Check the Finance Dashboard to ensure Revenue - Cost = Profit matches the generated records.
