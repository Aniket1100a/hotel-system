# 7. Test Execution Report

**Date Executed:** [Current Date]
**Executed By:** Automated Local API Runner
**Scope:** Functional, Performance, and Security.

## 1. Security & Functional Execution
| ID | Test Name | Execution Time | Result | Notes |
|---|---|---|---|---|
| TC_AUTH_01 | Admin Login | 422ms | ✅ Pass | Secure hashing overhead acceptable. |
| TC_AUTH_02 | Invalid Credentials | 374ms | ✅ Pass | |
| TC_AUTH_03 | Waiter RBAC Validation | 395ms | ✅ Pass | FIXED. Waiters correctly blocked from Staff API. |
| TC_MENU_01 | Fetch Menu | 33ms | ✅ Pass | |

## 2. Load Testing Execution (1 Year Simulated Data)
**Data Size:** 14,640 Orders, 36,691 Order Items, 14,640 Invoices.

| ID | Test Name | Execution Time | Target | Result |
|---|---|---|---|---|
| LOAD_01 | Aggregate 1-Year Revenue Stats | 388ms | < 500ms | 🟢 EXCELLENT |
| LOAD_02 | Fetch Latest Billing Invoices | 33ms | < 500ms | 🟢 EXCELLENT (Fixed via Pagination) |
| LOAD_03 | Manager Dashboard (100 Active Tables) | 88ms | < 500ms | 🟢 EXCELLENT (Fixed via select_related) |

## 3. Discovered & Resolved Issues
1. **Duplicate Billing:** (Fixed) Added API validations.
2. **Negative Inventory:** (Fixed) Added DB checks before depletion.
3. **N+1 Query Lag:** (Fixed) Implemented `select_related` in OrderViewSet.
4. **Missing DB Indexes:** (Fixed) Added `db_index=True` and ran migrations.