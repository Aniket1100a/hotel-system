import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, UtensilsCrossed, Receipt, LogOut, Loader2, Menu, Users, Package, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProtectedRoute() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Menu Management', href: '/menu', icon: UtensilsCrossed },
    { name: 'Billing & Orders', href: '/billing', icon: Receipt },
  ];

  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    navigation.push({ name: 'Staff Management', href: '/staff', icon: Users });
    navigation.push({ name: 'Inventory', href: '/inventory', icon: Package });
    navigation.push({ name: 'Table Management', href: '/tables', icon: Square });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
              <span className="font-bold text-lg tracking-tight">HOTEL</span>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-slate-100 text-indigo-600"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden h-16 flex items-center px-4 bg-white border-b border-slate-200 shrink-0">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded md flex items-center justify-center text-white font-bold text-xs">H</div>
            <span className="font-bold tracking-tight text-slate-800">HOTEL</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
