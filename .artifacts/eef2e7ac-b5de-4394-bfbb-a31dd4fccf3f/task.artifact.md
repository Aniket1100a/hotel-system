# Task: Hierarchical Revenue Analytics & Excel Export

## Backend Development
- [ ] **Dependency Setup**
    - [ ] Install `openpyxl`
- [ ] **API Implementation**
    - [ ] Update `revenue_stats` in `billing/views.py` for full-year daily data
    - [ ] Implement `export_revenue_excel` action in `InvoiceViewSet`

## Web Admin Frontend
- [ ] **UI Reconstruction (`Reports.tsx`)**
    - [ ] Update `RevenueData` interface
    - [ ] Implement hierarchical "Annual History" view (Month > Day)
    - [ ] Add "Download Report (.xlsx)" button and logic
- [ ] **Polishing**
    - [ ] Style the expandable month rows
    - [ ] Ensure consistent total calculations

## Verification
- [ ] Verify hierarchical drill-down
- [ ] Verify Excel download and data accuracy
