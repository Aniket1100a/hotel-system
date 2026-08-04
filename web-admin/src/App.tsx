/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Overview from './pages/Overview';
import MenuManagement from './pages/MenuManagement';
import Billing from './pages/Billing';
import StaffManagement from './pages/StaffManagement';
import Inventory from './pages/Inventory';
import TableManagement from './pages/TableManagement';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

import RoleGuard from './components/RoleGuard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Overview />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin & Manager Only */}
            <Route element={<RoleGuard allowedRoles={['ADMIN', 'MANAGER']} />}>
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/tables" element={<TableManagement />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}
