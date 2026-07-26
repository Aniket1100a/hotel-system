import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Overview from './pages/Overview'
import MenuManagement from './pages/MenuManagement'
import Billing from './pages/Billing'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="billing" element={<Billing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
