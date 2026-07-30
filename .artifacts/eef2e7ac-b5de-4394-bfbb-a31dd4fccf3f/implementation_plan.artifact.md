# Implementation Plan - Final Bill Alignment & Layout Fix

Fix the thermal bill layout to ensure perfect alignment, correct restaurant name, and clear quantity display.

## User Review Required

> [!IMPORTANT]
> **Restaurant Name**: I will update the name to **HOTEL GANDHARVA** as shown in your photo.
>
> **Alignment Strategy**: I will use a **fixed table layout** with precise character-based widths to ensure that columns never shift, even with long dish names.

## Proposed Changes

### Web Admin Frontend

#### [MODIFY] [printUtils.ts](file:///F:/hotel management/hotel-system/web-admin/src/lib/printUtils.ts)
- Change header to **HOTEL GANDHARVA**.
- Add `table-layout: fixed` to all tables.
- Explicitly set `width` on both `th` and `td` for every column.
- Use `word-wrap: break-word` for item names to prevent them from pushing the Price/Qty columns.
- Ensure `text-align: right` is applied consistently via inline styles to bypass potential CSS issues in the temporary window.
- Add a safety check for `quantity` to ensure it displays even if zero or null.

## Verification Plan

### Manual Verification
1. Click **"Bill Table"** on the Dashboard.
2. Check the print preview:
    - **Header**: Verify it says "HOTEL GANDHARVA".
    - **Columns**: Ensure "No., Item, Qty, Price, Amount" are perfectly aligned in straight vertical lines.
    - **Quantity**: Ensure the number (e.g., 5, 1, 8) is visible in the Qty column.
