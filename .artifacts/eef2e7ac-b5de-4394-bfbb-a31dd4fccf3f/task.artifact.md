# Task: Fix Menu Links & Enable Editing

## Backend Development
- [ ] **Billing Logic Sanity Check**
    - [ ] Update `InvoiceSerializer.create` in `billing/serializers.py` with safety checks

## Web Admin (React)
- [ ] **Menu Management UI Refactor**
    - [ ] Add state for `editingItem` and `editingCategory`
    - [ ] Implement `handleEditItem` and `handleEditCategory` functions
    - [ ] Update `handleAddItem` and `handleAddCat` to support updating (PATCH)
    - [ ] Add "Linked Product" column to the Items table
    - [ ] Add auto-fill logic for "Deduct Qty" in the modal
- [ ] **UI Polish**
    - [ ] Ensure delete/edit buttons are always accessible or have better hover states

## Verification
- [ ] Edit an existing item (e.g., "sprite") to link it to inventory
- [ ] Verify the link appears in the table
- [ ] Perform a test bill and check stock deduction
