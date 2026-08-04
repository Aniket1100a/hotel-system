# Task: Implement Strict RBAC for Waiters

- [ ] **Frontend: Sidebar and Routing**
    - [ ] Update `ProtectedRoute.tsx` to hide "Live Orders" (Financial Records) for Waiters.
    - [ ] Update `App.tsx` to protect `/billing` route from Waiters.
- [ ] **Frontend: Dashboard (Overview)**
    - [ ] Hide "Net Revenue" stat card for `WAITER`.
    - [ ] Hide "Complete & Generate Bill" button for `WAITER` on order cards.
    - [ ] Hide Payment Method selection for `WAITER`.
    - [ ] Adjust Takeaway flow to skip automatic billing for `WAITER`.
- [ ] **Verification**
    - [ ] Log in as Waiter and verify restrictions.
    - [ ] Log in as Admin/Biller and verify full access remains.
