# Implementation Plan - Hotel Chaturthi Pure Veg (Phase 1)

This plan outlines the core operational features for Phase 1 of the Restaurant Management System, as per the clarified requirements.

## User Review Required

> [!IMPORTANT]
> **Waiters' 2-Minute Rule**: I will implement a server-side check that prevents waiters from deleting or modifying order items after 2 minutes of the order being placed.
>
> **Manual Table Clearing**: I will add a "Close Table" feature for Managers/Cashiers/Owners to manually reset a table status to `FREE`, logging whether it was cleared as "Paid" or "Unpaid".
>
> **KOT Logic**: Every "Save" or "Update" on a table will generate a new Kitchen Order Ticket (KOT) for only the newly added items.

## Proposed Changes

### 1. Floor & Table Management (`tables` app)

#### [MODIFY] [models.py](file:///F:/hotel management/hotel-system/backend/apps/tables/models.py)
- [NEW] `TableSection` model: `name` (e.g., Main Hall, Garden).
- [MODIFY] `DiningTable` model: Add `section` (ForeignKey to `TableSection`).

### 2. Order & Kitchen Management (`orders` app)

#### [MODIFY] [models.py](file:///F:/hotel management/hotel-system/backend/apps/orders/models.py)
- [NEW] `KOT` model: Links to `Order`, tracks a specific "ticket" of items.
- [MODIFY] `OrderItem`: Add `status` (PENDING, PREPARING, READY), `kot` (FK to `KOT`), and `is_served` boolean.

#### [MODIFY] [views.py](file:///F:/hotel management/hotel-system/backend/apps/orders/views.py)
- Implement the 2-minute time check logic on `update` and `partial_update`.
- Logic to auto-mark Order as `SERVED` when all items are marked `READY`.

### 3. Billing & Audit (`billing` & `accounts` apps)

#### [MODIFY] [models.py](file:///F:/hotel management/hotel-system/backend/apps/billing/models.py)
- [MODIFY] `Invoice`: Ensure it records `billed_by` (Employee ID/Name) and add a field for `discount_approved_by` if a Manager approved a Cashier's discount.

#### [MODIFY] [views.py](file:///F:/hotel management/hotel-system/backend/apps/billing/views.py)
- Restricted "Manual Table Clear" endpoint for Managers/Cashiers/Owners.

### 4. UI Enhancements & Printing

#### Web Admin (React)
- **Dashboard**: Group tables by `TableSection`.
- **User Management**: Ensure every employee has a clear ID/Username.
- **Kitchen View**: [NEW] A dedicated page for Kitchen Staff to view incoming orders (Digital KOT Display) and mark items as `READY`.
- **Thermal Printing**: [NEW] Create optimized, narrow-width layouts (80mm) for **Bills only**, including Hotel Chaturthi branding and tax details.
- **Digital Invoices**: Ensure the Billing page generates a clean digital view that can be saved as PDF or shared.

#### Waiter App (Flutter)
- **Order Status**: Display live readiness status (e.g., "Ready" icons) for each item in the order list.
- **2-Minute Timer**: Show a visual countdown or lock the edit button after 2 mins.

## Verification Plan

### Automated Tests
- Test 2-minute edit restriction via API.
- Test KOT generation for incremental orders.
- Test Role-based access for Discounts and Table Clearing.

### Manual Verification
1. Place an order as a Waiter. Try to edit it after 1 minute (should work) and after 3 minutes (should fail).
2. Mark items as Ready in the Kitchen View. Verify the Waiter App updates in real-time.
3. Generate a bill with a discount as a Manager and verify the audit log shows the Manager's name.
