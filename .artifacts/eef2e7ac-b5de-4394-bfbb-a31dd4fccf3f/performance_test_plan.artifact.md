# 8. Performance Test Plan (Low-End Hardware)

## Target Environment Constraints
- **Hardware:** Intel Core i3 5th Gen (Dual Core), 4GB RAM, HDD/SATA SSD.
- **Browser:** Google Chrome.
- **Network:** 2.4GHz Local WiFi (Variable Ping).

## Strategy & Optimizations

### 1. Database Indexing (Django / SQLite)
Because SQLite handles the entire 1-year historical dataset (tens of thousands of rows), we must prevent **Full Table Scans**.
- `db_index=True` applied to `Order.status` and `Order.created_at`.
- `db_index=True` applied to `Invoice.is_paid` and `Invoice.created_at`.

### 2. Payload Reduction (Pagination)
To prevent the React Admin app from hoarding RAM and crashing Chrome on a 4GB machine, **API Pagination** is strictly enforced.
- **Limit:** 500 records maximum per API call.
- **Handling:** Custom Axios Interceptor in React unwraps the paginated JSON safely.

### 3. Query Optimization (N+1 Prevention)
When viewing 100 active tables, the backend originally fired 100+ separate SQL queries to fetch Table and Waiter relations.
- **Optimization:** Utilized Django's `select_related('table', 'waiter')` to execute a single, efficient SQL JOIN.
- **Benchmark:** Dashboard loading reduced from >2,000ms down to 88ms.

## Measurable Targets
| Metric | Threshold |
|---|---|
| API Payload Delivery | `< 250ms` |
| Heavy Aggregation (Revenue) | `< 500ms` |
| Chrome Tab Memory | `< 300MB` (Idle) |
| Browser LCP (Largest Contentful Paint) | `< 2.5s` |