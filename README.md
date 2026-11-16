# 🏨 Hotel Order & Billing System

A self-hosted hotel management system designed to run **entirely for free,
on your local WiFi network** — no cloud hosting, no subscriptions. The
Django server runs on any PC in the hotel; the React admin panel and the
Flutter waiter app both talk to it over the local network.

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

## Project Structure

```
hotel-system/
├── backend/            Django REST API (source of truth for all data)
│   ├── config/          Project settings, URLs
│   └── apps/
│       ├── accounts/    Custom user model + roles, JWT login
│       ├── menu/        Categories & menu items
│       ├── tables/      Dining tables & status
│       ├── orders/      Orders & order items (used by waiter app)
│       └── billing/     Invoice generation
├── web-admin/           React (Vite) app — menu management & billing, for hotel staff/owner
├── waiter-app/          Flutter app — order taking, for waiters on phones/tablets
└── docs/                Extra notes
```

## Why this architecture

- **One backend, multiple clients.** Django REST Framework exposes a single
  JSON API; both the React web app and the Flutter mobile app consume it.
  Anything added later (a kitchen display app, a customer-facing QR menu,
  etc.) just becomes another client of the same API.
- **SQLite, not Postgres.** Zero setup, zero extra services — the whole
  backend is just Python + one `db.sqlite3` file. Good enough for a single
  hotel's local traffic; can be swapped for Postgres later without touching
  the apps.
- **JWT auth with roles.** One login system serves everyone. The `role`
  field (`ADMIN`, `MANAGER`, `WAITER`, `BILLER`, `KITCHEN`) is embedded in
  the token, so clients can route users to the right screen and the API can
  restrict who can edit the menu vs. who can just take orders.
- **Runs on hotel WiFi, not the internet.** The Django server binds to your
  PC's local IP; every device (waiter tablets, the billing counter PC) just
  needs to be on the same WiFi network — no domain, no HTTPS cert, no
  hosting bill.

## Current features (v0 — basic skeleton)

- ✅ JWT login/auth for all apps, with staff roles
- ✅ Menu management (categories + items, availability toggle) — React
- ✅ Table list with status
- ✅ Order placement (table + items) — Flutter
- ✅ Billing: generate invoice from a served order, auto tax/total — React
- ✅ Django admin panel for direct DB management

**Not built yet (next steps):** order status updates from a kitchen
screen, printable/PDF invoices, real-time order notifications, table QR
codes, sales reports, multi-branch support, staff attendance.

---

## 1. Backend setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit ALLOWED_HOSTS with your PC's local IP

python manage.py makemigrations accounts menu tables orders billing
python manage.py migrate
python manage.py createsuperuser   # create your first ADMIN login
```

### Find your PC's local WiFi IP

- **Windows:** `ipconfig` → look for "IPv4 Address" under your WiFi adapter
- **Mac/Linux:** `ifconfig` or `ip addr` → look for something like `192.168.x.x`

Add that IP to `backend/.env` under `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.

### Run the server so other devices on WiFi can reach it

```bash
python manage.py runserver 0.0.0.0:8000
```

Now the API is reachable at `http://<your-pc-ip>:8000/api/` from any phone,
tablet, or laptop on the same WiFi. Django admin is at
`http://<your-pc-ip>:8000/admin/`.

> After creating your superuser, open Django admin and set their **role**
> to `ADMIN` (the createsuperuser command doesn't ask for it), and add a
> few `DiningTable` and `Category`/`MenuItem` entries to get started.

## 2. Web Admin setup (React)

```bash
cd web-admin
npm install
cp .env.example .env            # set VITE_API_BASE_URL to http://<your-pc-ip>:8000/api
npm run dev -- --host
```

Open the printed URL (e.g. `http://<your-pc-ip>:5173`) from any browser on
the WiFi — including the billing counter's PC.

For a permanent setup, run `npm run build` and serve the `dist/` folder
with any static file server (or Django's own static files) instead of
running the dev server continuously.

## 3. Waiter App setup (Flutter)

```bash
cd waiter-app
flutter pub get
```

Edit `lib/services/api_config.dart` and set `baseUrl` to your backend's
local IP:

```dart
static const String baseUrl = 'http://<your-pc-ip>:8000/api';
```

Then run on a connected phone/tablet (same WiFi as the server):

```bash
flutter run
```

Or build an installable APK for waiters' devices:

```bash
flutter build apk --release
# APK will be at build/app/outputs/flutter-apk/app-release.apk
```

---

## Everyday login flow

1. Waiters log in on the Flutter app with their `WAITER` account → pick a
   table → add items from the menu → place order.
2. Kitchen/manager sees orders via Django admin for now (a dedicated
   kitchen screen is a good next feature).
3. When an order is marked `SERVED` (currently done via Django admin —
   a "mark served" button is a good next addition), it shows up in the
   React **Billing** page, ready for invoice generation.
4. Admin/Manager manage the menu from the React **Menu Management** page.

## Notes on scaling this up later

- Swap SQLite → PostgreSQL if the hotel is large or you want concurrent
  writes to be extra safe (`DATABASES` in `backend/config/settings.py`).
- Add Django Channels / WebSockets for live order updates instead of
  polling.
- Add a `KITCHEN` role screen (could be another small Flutter/React app,
  or a simple browser page on a kitchen tablet).
- Put the whole backend behind `gunicorn` + `nginx` on the hotel PC for a
  more production-grade always-on setup (still 100% local, still free).
