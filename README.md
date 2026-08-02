# 🏨 Hotel Order & Billing System

A self-hosted hotel management system designed to run **entirely for free, on your local WiFi network** — no cloud hosting, no subscriptions. The Django server runs on any PC in the hotel; the React admin panel and the Flutter waiter app both talk to it over the local network.

```
┌─────────────────────┐        ┌──────────────────────┐
│   React Web Admin    │◄──────►│                       │
│ (Menu / Billing mgmt)│  HTTP  │   Django REST API     │
└─────────────────────┘  (JWT) │   + SQLite database   │
┌─────────────────────┐        │   (runs on hotel PC)  │
│  Flutter Waiter App  │◄──────►│                       │
│  (Order taking)       │        └──────────────────────┘
└─────────────────────┘
        all devices connected to the same hotel WiFi router
```

## 🚀 Comprehensive Feature List

### 1. Core Backend (Django REST Framework)
- **Multi-Role Authentication:** JWT-based login for ADMIN, MANAGER, WAITER, KITCHEN, and BILLER.
- **Inventory Engine:** Track raw materials (kg, ltr, pcs), low-stock alerts, and stock wastage logging.
- **Dynamic Menu System:** Support for categories, sub-categories, variants (e.g., Small/Large), and seasonal availability.
- **Order Lifecycle API:** Transitions from `PENDING` ➔ `PREPARING` ➔ `READY` ➔ `SERVED` ➔ `PAID` ➔ `CANCELLED`.
- **Billing Logic:** Automatic GST/Tax calculation, discounts, and split-billing support.
- **Real-time Notifications:** (Via WebSockets/Polling) for kitchen and waiters.

### 2. Web Admin Panel (React + Tailwind)
- **Dashboard:** Visual charts for daily sales, top-selling items, and low-stock warnings.
- **Menu Management UI:** Drag-and-drop category ordering, image uploads for items, and bulk price updates.
- **Billing Desk:**
    - Live view of all active tables and their current bill amounts.
    - Generate and print thermal-printer-friendly invoices.
    - Payment mode selection (Cash, UPI, Card).
- **Inventory Tracker:** View stock levels, add purchase logs, and generate wastage reports.
- **Staff Management:** Add/remove staff, assign roles, and view simple attendance/activity logs.
- **Reports:** Exportable PDF/Excel reports for daily, weekly, and monthly sales.

### 3. Waiter App (Flutter)
- **Interactive Table Grid:** Color-coded tables (Green: Available, Red: Occupied, Yellow: Billing).
- **Quick Order Interface:**
    - Searchable menu with quick-add buttons.
    - Add "Kitchen Remarks" (e.g., "Non-spicy").
    - Modify/Add items to existing active orders.
- **Live Status:** Waiters get a notification when the kitchen marks an order as "Ready".
- **Bill Request:** Waiters can trigger a "Bill Request" to the admin desk from the table.

### 4. Kitchen Display System (KDS) - *Proposed*
- **Live Order Queue:** Tiled view of incoming orders with "Time Elapsed" timers.
- **Item-wise View:** Group same items from different tables (e.g., "Total 5 Coffees to make").
- **Status Toggles:** One-tap to mark an item or the whole order as "Cooking" or "Ready".

---

## Project Structure

```
hotel-system/
├── backend/            Django REST API (source of truth for all data)
│   ├── config/          Project settings, URLs
│   └── apps/
│       ├── accounts/    Custom user model + roles, JWT login
│       ├── menu/        Categories & menu items
│       ├── tables/      Dining tables & status
│       ├── orders/      Orders & order items
│       ├── inventory/   Stock & wastage tracking
│       ├── billing/     Invoice generation
│       └── staff/       Attendance & payroll records
├── web-admin/           React (Vite) app — Management & Billing
├── waiter-app/          Flutter app — Order taking for waiters
└── docs/                API Documentation & Setup Guides
```

## Setup Instructions

### 1. Backend setup (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

### 2. Web Admin setup (React)
```bash
cd web-admin
npm install
npm run dev -- --host
```

### 3. Waiter App setup (Flutter)
```bash
cd waiter-app
flutter pub get
flutter run
```

---

## 🛠 Tech Stack
- **Backend:** Python, Django, Django REST Framework, SQLite (Local).
- **Web:** React.js, Tailwind CSS, TanStack Query.
- **Mobile:** Flutter, Provider/Riverpod (State Mgmt).
- **Networking:** Local WiFi, HTTP/REST, JWT.
