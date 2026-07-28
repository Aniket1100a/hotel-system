# Walkthrough - Linked Inventory for Beverages

I have successfully implemented the automatic stock deduction system for beverages.

## Key Changes

### 1. Beverage to Stock Linking
- **[NEW] Database Fields**: `MenuItem` now has two new fields:
    - `linked_inventory_item`: Connects a menu dish to an item in your inventory.
    - `inventory_deduction_quantity`: Defines how many units (e.g., bottles) to subtract from stock per sale.
- **[NEW] Admin UI**: The "Add Menu Item" form now includes a dropdown to select an inventory item and specify the deduction amount.

### 2. Automatic Stock Deduction
- **Billing Integration**: When you click **"Bill Table"** on the dashboard:
    - The system scans the order for any items linked to the inventory.
    - It automatically subtracts the correct quantity from your current stock balance.
    - It generates an audit log in the **Stock History** with a note: *"Auto-deducted for Order #XX"*.

## How to Set it Up

1. **Inventory First**: Go to the **Inventory** page and create your stock (e.g., "Sprite 500ml", Unit "Piece", Stock "24").
2. **Menu Link**: Go to **Menu Management**, click **"Add Item"** (or Edit), and select "Sprite 500ml" from the **Link Inventory** dropdown. Set **Deduct Qty** to "1".
3. **Test Sale**: From the Waiter App, place an order for 2 Sprites.
4. **Auto-Deduct**: Once you generate the bill on the dashboard, check the Inventory page. Your stock will be "22", and a history entry will show the deduction.

> [!TIP]
> This system is perfect for tracking bottles and pre-packaged beverages. You can also use it for ingredients if you set the deduction to fractions (e.g., "0.5 kg").
