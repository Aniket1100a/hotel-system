# 3. Module-wise Testing Checklist

### 1. Authentication & Users
- [x] Login generates valid JWT.
- [x] Expired tokens trigger automatic refresh via React interceptor.
- [x] Invalid credentials return clear error messages.
- [x] **RBAC:** Waiters CANNOT access `/api/staff/` (HTTP 403).

### 2. Menu Management
- [x] Create, Read, Update, Delete Categories.
- [x] Create, Read, Update, Delete Menu Items.
- [x] Associate Menu Item with Inventory stock item.

### 3. Orders & Kitchen
- [x] Waiter can assign items to active tables.
- [x] Kitchen can transition item statuses (`PENDING` -> `PREPARING` -> `READY`).
- [x] Order calculates accurate subtotals dynamically.
- [x] **Inventory:** Creating order automatically depletes linked stock.

### 4. Billing & Reports
- [x] Bill generation locks the order from further edits.
- [x] Duplicate bills are rejected by the API.
- [x] Daily revenue aggregates correctly.
- [x] Monthly revenue aggregates correctly.
- [x] Billing API is paginated (Max 500 items) to prevent browser crashing.

### 5. Staff Management
- [x] Managers can mark daily attendance.
- [x] Payroll calculations aggregate total hours and basic salary correctly.
- [x] Salary advances deduct from net payable salary.