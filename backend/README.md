# 🚀 Hotel System Backend (API)

This is the core Django REST API for the Hotel Management System. It handles authentication, menu management, table tracking, order processing, and billing.

## 🛠 Tech Stack
- **Framework:** Django 5.x
- **API Toolkit:** Django REST Framework (DRF)
- **Auth:** JWT (SimpleJWT)
- **Database:** SQLite (default) / PostgreSQL (optional)

---

## 🏗 Setup & Installation

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables:**
   Copy `.env.example` to `.env` and configure your settings.
   ```bash
   cp .env.example .env
   ```

4. **Database Migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create Admin User:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run Server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

---

## 🔑 API Documentation

All API endpoints are prefixed with `/api/`. Authentication is handled via Bearer Tokens.

### 1. Authentication (`/api/auth/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/login/` | `POST` | Exchange credentials for Access & Refresh tokens. |
| `/refresh/` | `POST` | Get a new access token using a refresh token. |
| `/me/` | `GET` | Get profile of the currently logged-in user. |

### 2. Menu Management (`/api/menu/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/categories/` | `GET/POST` | List or create categories. |
| `/categories/{id}/` | `GET/PUT/DELETE` | Manage a specific category. |
| `/items/` | `GET/POST` | List or create menu items. |
| `/items/{id}/` | `GET/PUT/DELETE` | Manage a specific menu item. |

### 3. Tables (`/api/tables/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET/POST` | List all tables or create a new one. |
| `/{id}/` | `GET/PUT/DELETE` | Manage table details and status (Available/Occupied). |

### 4. Orders (`/api/orders/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET/POST` | List orders or place a new order. |
| `/{id}/` | `GET/PUT/DELETE` | View order details or update status (Pending/Served/etc). |

**Order Creation Payload Example:**
```json
{
  "table": 1,
  "notes": "Less spicy",
  "items": [
    {"menu_item": 5, "quantity": 2, "note": "Extra cheese"},
    {"menu_item": 12, "quantity": 1}
  ]
}
```

### 5. Billing (`/api/billing/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET/POST` | List invoices or generate a bill for an order. |
| `/{id}/` | `GET/PUT/DELETE` | Manage specific invoices. |

---

## 👥 User Roles
The system uses a custom user model with the following roles:
- `ADMIN`: Full access to everything.
- `MANAGER`: Access to reports and menu management.
- `WAITER`: Can view menu, tables, and place orders.
- `BILLER`: Can generate and settle invoices.
- `KITCHEN`: Can view and update order preparation status.

## 📡 Local WiFi Access
To access the API from other devices on the same WiFi:
1. Find your local IP (`ipconfig` on Windows).
2. Add the IP to `ALLOWED_HOSTS` in `.env`.
3. Start server using `0.0.0.0:8000`.
4. Clients connect to `http://<your-ip>:8000/api/`.
