# 1. Software Test Plan (STP)

## 1.1 Introduction
This document defines the Software Test Plan (STP) for the Hotel Management System. It encompasses the testing strategy for the Django REST API backend, the React Vite Web Admin Panel, and the Flutter Waiter App.

## 1.2 Scope
**In-Scope:**
- Floor & Table Management
- Order Management & Lifecycle
- Billing, Tax, and Discount processing
- Inventory tracking (Raw material depletion)
- Staff profiles, attendance, and payroll metrics
- Authentication & Role-Based Access Control (RBAC)

## 1.3 Test Strategy
- **Functional Testing:** Black-box manual testing via the UI and automated functional API tests.
- **Integration Testing:** Ensuring the React app correctly processes Django's paginated responses and handles token refreshes.
- **Security Testing:** Verifying JWT validation, and ensuring RBAC strictly separates `ADMIN/MANAGER` capabilities from `WAITER/KITCHEN` capabilities.
- **Performance Testing:** Load testing the SQLite database with 1-Year historical data to ensure Core i3 compatibility.

## 1.4 Test Environment
- **Local Dev Server:** `127.0.0.1:8000` (Backend) & `127.0.0.1:3000` (Frontend).
- **Target Hardware constraints:** Intel Core i3 5th Gen, 4GB RAM.
- **Database:** SQLite (with `db_index` optimizations applied).

## 1.5 Entry/Exit Criteria
- **Entry:** Source code compiles, database migrations applied successfully, and seed data is present.
- **Exit:** All P1 (Critical) bugs fixed. Performance metrics meet `< 500ms` API response target. No security vulnerabilities in RBAC.