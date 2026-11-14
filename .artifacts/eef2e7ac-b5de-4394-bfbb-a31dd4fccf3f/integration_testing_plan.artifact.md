# 5. Integration Testing Plan

## Frontend ➔ Backend Integration

### 1. Data Pagination Handling
- **Scenario:** Django returns paginated responses (`{ count, results: [] }`).
- **Validation:** React Axios interceptor seamlessly extracts `.results` so frontend components do not break.
- **Status:** Integrated and verified working.

### 2. JWT Lifecycle Management
- **Scenario:** User's Access Token expires while actively using the Web Admin.
- **Validation:** Axios interceptor catches HTTP 401, sends Refresh Token to `/api/auth/refresh/`, gets new token, and replays original request without logging user out.
- **Status:** Integrated.

### 3. Concurrency Sync (Offline/Online)
- **Scenario:** Flutter Waiter App submits an order during a brief WiFi drop.
- **Validation:** App handles network timeout. Does not resend duplicate POST requests automatically without verifying state, preventing double-orders on reconnect.

### 4. Real-time Status Sync
- **Scenario:** Kitchen marks an item `READY`.
- **Validation:** Waiter app polling/websocket receives update and notifies the waiter to pick up the dish.