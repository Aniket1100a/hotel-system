# Phase 1: Hotel Chaturthi Pure Veg Implementation

## Backend Development
- [x] **Table & Section Management**
    - [x] Create `TableSection` model in `tables/models.py`
    - [x] Update `DiningTable` to link to `TableSection`
    - [x] Create and run migrations
    - [x] Update serializers and viewsets for sections
- [x] **Digital KOT & Enhanced Orders**
    - [x] Create `KOT` model in `orders/models.py`
    - [x] Add `status` and `kot_id` to `OrderItem`
    - [x] Implement KOT generation logic on order save
    - [x] Implement 2-minute edit restriction logic
    - [x] Create and run migrations
- [x] **Billing & Manual Table Clearing**
    - [x] Add `discount_approved_by` to `Invoice`
    - [x] Implement manual "Close Table" endpoint for Managers
    - [x] Create and run migrations

## Web Admin (React)
- [x] **UI Refactor**
    - [x] Update Dashboard to group tables by sections
    - [x] Create dedicated "Kitchen Display" page for digital KOTs
    - [x] Design 80mm Thermal Bill layout
- [x] **Logic Updates**
    - [x] Add status toggles in Kitchen View

## Waiter App (Flutter)
- [x] **UI Enhancements**
    - [x] Display readiness status for each item
    - [x] Implement table selection and active order viewing logic
    - [ ] Implement 2-minute lock/timer on order edit
