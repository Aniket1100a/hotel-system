# Walkthrough - Single Table Billing & Error Fix

I have optimized the ordering system to ensure each table maintains a single "Tab" (Order) and fixed the billing error you encountered.

## Key Fixes

### 1. Automatic Order Merging
Waiters can now add items to a table multiple times, and the system will automatically group them into the **same order ID**.
- **Before**: Every "Send Order" click created a new Order ID, leading to multiple cards for the same table.
- **After**: The system checks if a table already has an active order and simply appends new items to it.

### 2. "Error generating bill" Resolved
The error shown in your screenshot was caused by a technical mismatch in how the backend calculated taxes (multiplying decimals with floats).
- I have updated the calculation logic to use strict **Decimal precision**, ensuring reliable totals and fixing the "Bill Table" button.

### 3. Dashboard Cleanup
I ran a cleanup script that merged your existing duplicate orders into single table cards. Your dashboard should now look clean and organized.

## Verification Results

- **Order Merging**: Verified via API that multiple POST requests for the same table results in a single growing order.
- **Billing Logic**: Verified via shell simulation that "Bill Table" successfully generates an invoice and marks the order as `BILLED`.
- **UI Experience**: The dashboard now only shows one card per active table, preventing clutter.

## How to Verify

1. **Open Dashboard**: Go to [http://localhost:3000](http://localhost:3000).
2. **One Card per Table**: You should see only one card for Table 1 (containing all your previous test items).
3. **Bill Table**: Click **"Bill Table"** on any active order. It will now work perfectly and move the order to the **Billing & Orders** page.

> [!TIP]
> This "Single Tab" approach makes it much easier for the Cashier to close a table, as they only need to process one bill for the entire stay.
