import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, UtensilsCrossed, Receipt, LogOut, Loader2, Menu, Users, Package, Square, BarChart2, Bell, Settings, ChevronRight, User as UserIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api/axios';

export default function ProtectedRoute() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Dropdown states
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      const fetchAlerts = async () => {
        try {
          const res = await api.get('/inventory/items/');
          const low = res.data.filter((i: any) => i.is_low_stock);
          setLowStockItems(low);
        } catch (e) {
          console.error("Failed to fetch alerts", e);
        }
      };
      fetchAlerts();
    }
  }, [user]);

  // Close dropdowns on location change or click away
  useEffect(() => {
    const handleGlobalClick = () => {
      setNotifOpen(false);
      setSettingsOpen(false);
    };

    if (notifOpen || settingsOpen) {
      window.addEventListener('click', handleGlobalClick);
    }

    return () => window.removeEventListener('click', handleGlobalClick);
  }, [notifOpen, settingsOpen]);

  useEffect(() => {
    setNotifOpen(false);
    setSettingsOpen(false);
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Menu & Catalog', href: '/menu', icon: UtensilsCrossed },
    { name: 'Live Orders', href: '/billing', icon: Receipt },
  ];

  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    navigation.push({ name: 'Analytics', href: '/reports', icon: BarChart2 });
    navigation.push({ name: 'Inventory', href: '/inventory', icon: Package });
    navigation.push({ name: 'Staff Management', href: '/staff', icon: Users });
    navigation.push({ name: 'Table Management', href: '/tables', icon: Square });
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar - Fixed/Static Position */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block h-full shrink-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full shadow-2xl lg:shadow-none"
      )}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-200">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[14px] leading-tight tracking-tight text-slate-900 uppercase">Grand Hotel</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Management System</span>
              </div>
            </div>
          </div>

          {/* Navigation - Static/Non-scrolling container */}
          <div className="flex-1 py-6 px-4 overflow-hidden">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm shadow-primary-50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "w-[18px] h-[18px] transition-colors",
                        isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
                      )} />
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile - Fixed at Bottom */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/60 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate">{user.username}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-slate-400">
              <span>Pages</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 font-semibold capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
             {/* Notifications */}
             <div className="relative">
               <button
                onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); setSettingsOpen(false); }}
                className={cn(
                  "p-2 rounded-full transition-all relative",
                  notifOpen ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
               >
                  <Bell className="w-5 h-5" />
                  {lowStockItems.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                  )}
               </button>

               {notifOpen && (
                 <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Alerts & Notifications</span>
                       <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md">{lowStockItems.length} New</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                       {lowStockItems.length > 0 ? (
                         lowStockItems.map((item: any) => (
                           <Link
                            key={item.id}
                            to="/inventory"
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                           >
                              <div className="mt-0.5 w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                                 <AlertTriangle className="w-4 h-4 text-rose-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[13px] font-bold text-slate-900 leading-tight">Low Stock: {item.name}</p>
                                 <p className="text-[11px] text-slate-500 mt-0.5">Currently {item.current_stock} {item.unit} remaining. Refill suggested.</p>
                              </div>
                           </Link>
                         ))
                       ) : (
                         <div className="px-6 py-12 text-center">
                            <Bell className="w-8 h-8 text-slate-100 mx-auto mb-3" />
                            <p className="text-[13px] font-bold text-slate-800">All caught up!</p>
                            <p className="text-[11px] text-slate-400 mt-1">No critical alerts at the moment.</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}
             </div>

             {/* Settings */}
             <div className="relative">
               <button
                onClick={(e) => { e.stopPropagation(); setSettingsOpen(!settingsOpen); setNotifOpen(false); }}
                className={cn(
                  "p-2 rounded-full transition-all",
                  settingsOpen ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
               >
                  <Settings className="w-5 h-5" />
               </button>

               {settingsOpen && (
                 <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden">
                    <div className="p-2">
                       <div className="px-3 py-2.5 mb-1">
                          <p className="text-[12px] font-bold text-slate-900">{user.username}</p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</p>
                       </div>
                       <div className="h-px bg-slate-100 mx-2 mb-1"></div>
                       <Link
                        to="/profile"
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-[13px] font-semibold group"
                       >
                          <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
                          Profile Settings
                       </Link>
                       <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-all text-[13px] font-semibold group"
                       >
                          <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-600" />
                          Sign Out
                       </button>
                    </div>
                 </div>
               )}
             </div>

             <div className="h-6 w-px bg-slate-200 mx-2"></div>
             <div className="flex flex-col items-end">
                <span className="text-[12px] font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="text-[10px] text-slate-400 font-medium">System Online</span>
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
