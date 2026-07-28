import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Users, Utensils, ReceiptText, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Loader2, RefreshCcw, Receipt, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { printDirectly } from '@/lib/printUtils';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: number;
  table_number: string;
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'BILLED' | 'CANCELLED';
  total_amount: string;
  items: OrderItem[];
  waiter_name: string;
  created_at: string;
}

interface Table {
  id: number;
  number: string;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  section_name: string;
}

interface SectionGroup {
  [key: string]: Table[];
}

export default function Overview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [tablesBySection, setTablesBySection] = useState<SectionGroup>({});
  const [stats, setStats] = useState({
    tablesActive: 0,
    ordersToday: 0,
    revenueToday: 0,
  });

  const fetchDashboardData = async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        api.get('/tables/'),
        api.get('/orders/'),
      ]);

      const tables = tablesRes.data;
      const occupied = tables.filter((t: any) => t.status === 'OCCUPIED').length;
      const orders = ordersRes.data;

      // Group tables by section
      const groups = tables.reduce((acc: SectionGroup, table: Table) => {
        const section = table.section_name || 'Unassigned';
        if (!acc[section]) acc[section] = [];
        acc[section].push(table);
        return acc;
      }, {});

      // Filter for active orders (not billed or cancelled)
      const active = orders.filter((o: Order) =>
        ['PENDING', 'PREPARING', 'SERVED'].includes(o.status)
      );

      // Calculate today's revenue from BILLED orders
      const revenue = orders
        .filter((o: Order) => o.status === 'BILLED')
        .reduce((sum: number, o: Order) => sum + parseFloat(o.total_amount), 0);

      setTablesBySection(groups);
      setActiveOrders(active);
      setStats({
        tablesActive: occupied,
        ordersToday: orders.length,
        revenueToday: revenue,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleGenerateBill = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to generate a bill for this order?")) return;

    try {
      const res = await api.post('/billing/', { order: orderId });
      const invoice = res.data;

      // Fetch items for printing
      const orderRes = await api.get(`/orders/${orderId}/`);

      printDirectly({
        ...invoice,
        items: orderRes.data.items
      });

      alert("Bill generated and table freed!");
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to generate bill", err);
      alert("Error generating bill. Please try again.");
    }
  };

  const statCards = [
    {
      name: 'Occupied Tables',
      value: stats.tablesActive.toString(),
      icon: Users,
      change: '+2',
      changeType: 'positive',
    },
    {
      name: 'Orders Today',
      value: stats.ordersToday.toString(),
      icon: Utensils,
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      name: 'Revenue Today',
      value: '₹1,240.00', // Mocked
      icon: ReceiptText,
      change: '+5.2%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {user?.username}. Monitoring {activeOrders.length} active orders.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => { setLoading(true); fetchDashboardData(); }}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kitchen Live
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <item.icon className="w-5 h-5 text-slate-600" />
              </div>
              <p className={cn(
                "text-xs font-medium flex items-center",
                item.changeType === 'positive' ? "text-emerald-600" : "text-rose-600"
              )}>
                {item.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {item.change}
              </p>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Table Sections Grid */}
      <div className="mt-10">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <LayoutGrid className="w-5 h-5 text-indigo-500" />
          Floor Management & Table Status
        </h3>

        <div className="space-y-8">
          {Object.entries(tablesBySection).map(([section, tables]) => (
            <div key={section} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-px bg-slate-200 flex-grow"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">{section}</span>
                <span className="h-px bg-slate-200 flex-grow"></span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-default shadow-sm",
                      table.status === 'FREE' ? "bg-white border-slate-100 text-slate-900" :
                      table.status === 'OCCUPIED' ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" :
                      "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    <span className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-tighter">Table</span>
                    <span className="text-2xl tracking-tighter">{table.number}</span>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-2",
                      table.status === 'FREE' ? "bg-slate-300" :
                      table.status === 'OCCUPIED' ? "bg-indigo-500 animate-pulse" :
                      "bg-amber-500"
                    )}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Live Table Orders
          </h2>
        </div>

        {loading && activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading live kitchen data...</p>
          </div>
        ) : activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                      {order.table_number}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Order #{order.id}</p>
                      <p className="text-[10px] text-slate-500 italic">Waiter: {order.waiter_name}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                    order.status === 'PENDING' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    order.status === 'PREPARING' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    {order.status}
                  </span>
                </div>

                <div className="p-5 flex-grow">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-100 text-slate-600 rounded text-[10px] flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-slate-700 font-medium">{item.menu_item_name}</span>
                        </div>
                        <span className="text-slate-400 font-mono">₹{parseFloat(item.subtotal).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p>
                    <p className="text-lg font-bold text-slate-900">₹{parseFloat(order.total_amount).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleGenerateBill(order.id)}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                  >
                    <Receipt className="w-4 h-4" />
                    Bill Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
            <p className="text-slate-500 mt-1">There are no active tables or pending orders right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
