# Implementation Plan - Fix Menu Links & Edit Support

Enhance the Menu Management page to ensure inventory links are saved correctly and allow editing existing items to connect them to inventory.

## User Review Required

> [!IMPORTANT]
> **Stock Link Visibility**: I will add a new column to your Menu table so you can see exactly which dishes are linked to which inventory products.
>
> **Editing Support**: I am enabling the **Edit (Pencil)** button so you can link your existing items (like Coffee or Tea) to inventory without having to delete and re-add them.

## Proposed Changes

### Web Admin Frontend

#### [MODIFY] [MenuManagement.tsx](file:///F:/hotel management/hotel-system/web-admin/src/pages/MenuManagement.tsx)
- Implement **Edit Item** logic:
    - clicking the pencil icon will open the modal pre-filled with the item's data.
    - `handleSubmit` will handle both `POST` (create) and `PATCH` (update).
- Implement **Edit Category** logic.
- Add **"Linked Product"** column to the Menu Items table.
- **Auto-Fill Logic**: When selecting an inventory item, if the "Deduct Qty" is 0 or empty, automatically set it to **1.00** to ensure stock is deducted.

### Backend (`billing` app)
- The deduction logic is already correct, but I will add a sanity check to ensure it doesn't fail if an inventory item is missing.

## Verification Plan

### Manual Verification
1. Open **Menu Management**.
2. Click the **Edit (Pencil)** icon on "Coffee".
3. Select an inventory item and set "Deduct Qty" to 1. Save.
4. Verify the "Linked Product" column now shows the connection.
5. Create a test bill and verify the stock decreases in the **Inventory** page.
