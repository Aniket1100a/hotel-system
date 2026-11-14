# 2. Detailed Test Case Document

## Table Management
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Expected Result |
|---|---|---|---|---|---|
| TC_TBL_01 | Tables | Seat a guest at a table | Table is 'FREE' | Waiter opens table map, clicks Table 4, starts order. | Table status updates to 'OCCUPIED' locally and in DB. |
| TC_TBL_02 | Tables | Concurrency lock on Table | Table is 'FREE' | Two waiters open Table 4 and start an order simultaneously. | DB locks transaction; only one order ID is created. The other waiter sees Table is now 'OCCUPIED'. |

## Order Management
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Expected Result |
|---|---|---|---|---|---|
| TC_ORD_01 | Orders | Append items to active order | Order is 'PENDING' | Waiter clicks active Table 4, adds 1x Roti, submits. | Item is appended to existing order. No duplicate order created. |
| TC_ORD_02 | Orders | Negative Inventory Check | Item stock is 1 | Waiter orders 2x of Item. | System throws validation error: 'Insufficient stock'. Checkout blocked. |

## Billing & Payment
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Expected Result |
|---|---|---|---|---|---|
| TC_BIL_01 | Billing | Prevent Duplicate Billing | Order status 'PENDING' | Cashier double-clicks "Generate Bill" rapidly. | API validates `order.status`. First click generates Invoice, second click returns 400 Bad Request. |
| TC_BIL_02 | Billing | Apply Discount & Tax | Bill generated | Add 5% tax and ₹50 discount. | System calculates `(Subtotal + Tax) - Discount`. Total is accurate to two decimal places. |
| TC_BIL_03 | Billing | Close table after payment | Invoice is 'PAID' | Cashier marks bill as Paid. | Order status -> 'BILLED'. Table status -> 'FREE'. |