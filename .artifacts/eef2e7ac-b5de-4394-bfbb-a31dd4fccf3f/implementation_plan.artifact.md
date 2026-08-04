# Implementation Plan - Refined Waiter Access

This plan implements strict restrictions for the `WAITER` role while ensuring they can still see active "Live Orders" on the dashboard for operational purposes. Sensitive financial data (Revenue, Audit Logs, Settlement Records) will be hidden.

## User Review Required

> [!IMPORTANT]
> **Visibility vs. Control:**
> - **Waiters CAN see:** Active orders on the Dashboard (Tables and Takeaway) including items and individual order totals.
> - **Waiters CANNOT see:** The "Net Revenue" summary, the "Financial Records" (Billing) history page, or the buttons to finalize/complete bills.

## Proposed Changes

### Frontend (React Web-Admin)

#### [MODIFY] [ProtectedRoute.tsx](file:///F:/hotel%20management/hotel-system/web-admin/src/components/ProtectedRoute.tsx)
-   Move the `Live Orders` (which points to `/billing`) navigation item inside the management/biller role check. This page contains financial history which is sensitive.

#### [MODIFY] [Overview.tsx](file:///F:/hotel%20management/hotel-system/web-admin/src/pages/Overview.tsx)
-   **Dashboard Stats:** Hide the "Net Revenue" stat card for `WAITER`.
-   **Order Actions:**
    -   Hide the "Complete & Generate Bill" button for `WAITER`.
    -   Hide the "Payment Method" dropdown for `WAITER`.
    -   *Result:* Waiters can see what's ordered and the total, but cannot settle the bill.

---

### Backend (Django)

-   Permissions are already in place to prevent Waiters from accessing revenue statistics and sensitive staff/inventory data.

## Verification Plan

### Manual Verification
1.  **Login as Waiter:**
    -   Confirm you can see the list of active orders on the Dashboard.
    -   Confirm the "Net Revenue" card is gone.
    -   Confirm the "Live Orders" link in the sidebar is gone.
    -   Confirm you cannot see the "Complete & Generate Bill" button on active orders.
2.  **Login as Admin/Biller:**
    -   Confirm all features (Revenue, Billing page, Settlement buttons) are still visible and functional.
