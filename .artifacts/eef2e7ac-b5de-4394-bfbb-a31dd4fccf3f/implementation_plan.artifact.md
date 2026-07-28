# Implementation Plan - Single Table Tab & Billing Fix

Ensure each dining table has only one active "tab" (Order) at a time. All items added by waiters will append to this single active order. This also fixes the "Error generating bill" issue caused by multiple orders on the same table.

## User Review Required

> [!IMPORTANT]
> **Order Merging**: From now on, when a waiter adds items to a table that already has an order, the system will NOT create a new order ID. It will simply add the items to the existing one.
>
> **Data Cleanup**: I will automatically merge your current active orders (like the three separate orders for Table 1) into a single order so your dashboard looks clean immediately.

## Proposed Changes

### 1. Backend (`orders` app)

#### [MODIFY] [serializers.py](file:///F:/hotel management/hotel-system/backend/apps/orders/serializers.py)
- Update `OrderSerializer.create`:
    - Check if the table has an active order (Status: PENDING, PREPARING, SERVED).
    - If found, redirect the logic to the `update` method of that existing order.
    - If not found, create a new order as usual.

### 2. Data Migration / Cleanup

#### [NEW] [merge_orders.py](file:///F:/hotel management/hotel-system/backend/merge_orders.py)
- A script to find tables with multiple active orders and move all `OrderItems` to the oldest order, then delete the duplicates.

### 3. Web Admin Dashboard

#### [MODIFY] [Overview.tsx](file:///F:/hotel management/hotel-system/web-admin/src/pages/Overview.tsx)
- No major code changes needed, but ensuring only one card per table will resolve the UI clutter seen in the screenshot.

## Verification Plan

### Automated Tests
- Verify that calling POST `/orders/` twice for the same table resulting in only ONE order entry in the database.

### Manual Verification
1. Place an order for Table 1.
2. Place another order for Table 1 with different items.
3. Check the Dashboard: Verify only **one card** exists for Table 1 containing all items.
4. Click "Bill Table" and verify the bill is generated successfully without error.
