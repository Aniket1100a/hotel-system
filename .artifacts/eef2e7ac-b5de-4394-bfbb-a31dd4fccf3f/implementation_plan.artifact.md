# Implementation Plan - Hierarchical Revenue Analytics & Excel Export

Implement a nested, hierarchical view for revenue reports (**Year > Month > Day > Individual Bills**) and add an option to download the data as an **Excel (.xlsx)** file.

## User Review Required

> [!IMPORTANT]
> **New Dependency**: I will add `openpyxl` to the backend to support generating true Excel files.
>
> **Export Scope**: The Excel file will include two sheets:
> 1. **Summary**: Total revenue grouped by Month and Date.
> 2. **All Bills**: A detailed list of every transaction (Bill No, Table, Waiter, Amount, Date) for the selected period.

## Proposed Changes

### 1. Backend Development (`billing` app)

#### [MODIFY] [views.py](file:///F:/hotel management/hotel-system/backend/apps/billing/views.py)
- **Hierarchy Data**: Update `revenue_stats` to return daily totals for the **entire current year**.
- **Excel Export**: Add a new action `export_revenue_excel`:
    - Generate an `.xlsx` file using `openpyxl`.
    - Format data into multiple sheets for readability.
    - Return the file as a downloadable response.

### 2. Web Admin Frontend

#### [MODIFY] [Reports.tsx](file:///F:/hotel management/hotel-system/web-admin/src/pages/Reports.tsx)
- **Annual History Tab**:
    - Build an expandable **Month > Day** list using an Accordion UI.
    - Integrate the existing "Individual Bills" modal into the daily level of the hierarchy.
- **Excel Download Button**:
    - Add a **"Download Report (.xlsx)"** button at the top of the Reports page.
    - Link it to the new backend export endpoint.

## Verification Plan

### Automated Tests
- Verify the API correctly generates and serves a valid `.xlsx` file.

### Manual Verification
1. Open **Revenue Reports**.
2. Expand a month and verify the daily list appears.
3. Click the arrow on a day and verify the bill list modal opens.
4. Click **"Download Report"** and verify that the Excel file downloads and contains accurate transaction data.
