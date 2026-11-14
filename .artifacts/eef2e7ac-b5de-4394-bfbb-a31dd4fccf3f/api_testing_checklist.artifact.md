# 4. API Testing Checklist

| Endpoint | Method | Role Req. | Data Passed | Expected Response | Status |
|---|---|---|---|---|---|
| `/api/auth/login/` | POST | ANY | Username, Password | 200 OK + JWT Tokens | ✅ Pass |
| `/api/staff/profiles/` | GET | ADMIN/MGR | None | 200 OK (List of staff) | ✅ Pass |
| `/api/staff/profiles/` | GET | WAITER | None | 403 Forbidden | ✅ Pass (Fixed) |
| `/api/tables/` | GET | ANY | None | 200 OK (Paginated Tables) | ✅ Pass |
| `/api/orders/` | POST | ANY | Table ID, Items[] | 201 Created | ✅ Pass |
| `/api/billing/` | POST | MGR/CASH | Order ID, Discount | 201 Created | ✅ Pass |
| `/api/billing/` | POST | MGR/CASH | *Duplicate Order ID* | 400 Bad Request | ✅ Pass (Fixed) |
| `/api/billing/revenue_stats/` | GET | ADMIN/MGR | None | 200 OK (Aggregated Sums) | ✅ Pass |