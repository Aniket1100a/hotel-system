import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Users, Utensils, ReceiptText, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Loader2, RefreshCcw, Receipt, LayoutGrid, Plus, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { printDirectly } from '@/lib/printUtils';
import OrderDrawer from '@/components/OrderDrawer';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  price_at_order: string;
  subtotal: string;
}

interface Order {
  id: number;
  table_number: string | null;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'BILLED' | 'CANCELLED';
  total_amount: string;
  items: OrderItem[];
  waiter_name: string;
  is_handed_over: boolean;
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
  const [paymentMethods, setPaymentMethods] = useState<{[key: number]: string}>({});
  const [stats, setStats] = useState({
    tablesActive: 0,
    ordersToday: 0,
    revenueToday: 0,
  });

  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState<{tableId: number | null, tableName: string | null, isTakeaway: boolean}>({
    tableId: null,
    tableName: null,
    isTakeaway: false
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

      const groups = tables.reduce((acc: SectionGroup, table: Table) => {
        const section = table.section_name || 'Unassigned';
        if (!acc[section]) acc[section] = [];
        acc[section].push(table);
        return acc;
      }, {});

      const active = orders.filter((o: Order) =>
        ['PENDING', 'PREPARING', 'SERVED'].includes(o.status) ||
        (o.order_type === 'TAKEAWAY' && o.status === 'BILLED' && !o.is_handed_over)
      );

      const todayStr = new Date().toLocaleDateString('en-CA');
      const revenue = orders
        .filter((o: Order) => {
           const isBilled = o.status === 'BILLED';
           const isToday = new Date(o.created_at).toLocaleDateString('en-CA') === todayStr;
           return isBilled && isToday;
        })
        .reduce((sum: number, o: Order) => sum + parseFloat(o.total_amount), 0);

      setTablesBySection(groups);
      setActiveOrders(active);
      setStats({
        tablesActive: occupied,
        ordersToday: orders.filter((o: any) => new Date(o.created_at).toLocaleDateString('en-CA') === todayStr).length,
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
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateBill = async (orderId: number, skipConfirm = false, orderData?: Order) => {
    if (processingIds.has(orderId)) return;
    const order = orderData || activeOrders.find(o => o.id === orderId);
    if (order?.status === 'BILLED') return;
    const isTakeaway = order?.order_type === 'TAKEAWAY';
    const method = paymentMethods[orderId] || 'CASH';

    if (!skipConfirm && !isTakeaway) {
      if (!window.confirm(`Generate ${method} bill for this order?`)) return;
    }

    setProcessingIds(prev => new Set(prev).add(orderId));
    try {
      const res = await api.post('/billing/', {
        order: orderId,
        payment_method: method
      });
      const invoice = res.data;
      let items = order?.items;
      if (!items || items.length === 0) {
        const orderRes = await api.get(`/orders/${orderId}/`);
        items = orderRes.data.items;
      }

      printDirectly({
        ...invoice,
        items: items,
        waiter_name: order?.waiter_name || invoice.waiter_name,
        payment_method: invoice.payment_method,
        order_type: order?.order_type || 'DINE_IN',
        created_at: invoice.created_at
      });

      fetchDashboardData();
    } catch (err) {
      console.error("Failed to generate bill:", err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleHandover = async (orderId: number) => {
    try {
      await api.post(`/orders/${orderId}/mark_handed_over/`);
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to mark handed over", err);
    }
  };

  const onOrderPlacedHandler = (newOrder?: any) => {
    fetchDashboardData();
    const orderType = newOrder?.order_type || newOrder?.orderType;
    const orderId = newOrder?.id;
    if (orderId && orderType === 'TAKEAWAY') {
      handleGenerateBill(orderId, true, newOrder);
    }
  };

  const openTableOrder = (tableId: number, tableName: string) => {
    setDrawerConfig({ tableId, tableName, isTakeaway: false });
    setIsDrawerOpen(true);
  };

  const openTakeawayOrder = () => {
    setDrawerConfig({ tableId: null, tableName: null, isTakeaway: true });
    setIsDrawerOpen(true);
  };

  const statCards = [
    { name: 'Active Occupancy', value: stats.tablesActive.toString(), icon: Users, change: '+2', trend: 'up', label: 'Tables' },
    { name: 'Total Orders', value: stats.ordersToday.toString(), icon: Utensils, change: '+12%', trend: 'up', label: 'Today' },
    { name: 'Net Revenue', value: `₹${stats.revenueToday.toLocaleString()}`, icon: ReceiptText, change: '+5%', trend: 'up', label: 'Today' },
  ];

  const OrderCard = ({ order, paymentMethods, setPaymentMethods, handleGenerateBill, handleHandover, processingIds }: any) => {
    const isProcessing = processingIds.has(order.id);

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
              order.order_type === 'TAKEAWAY' ? "bg-slate-800 text-white" : "bg-primary-600 text-white"
            )}>
              {order.order_type === 'TAKEAWAY' ? <ShoppingBag className="w-5 h-5" /> : order.table_number}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {order.order_type === 'TAKEAWAY' ? 'Takeaway' : `Table Order`}
              </p>
              <h4 className="font-bold text-slate-800 text-[13px]">Order #{order.id}</h4>
            </div>
          </div>
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            order.status === 'PENDING' ? "bg-amber-50 text-amber-700 border-amber-100" :
            order.status === 'PREPARING' ? "bg-blue-50 text-blue-700 border-blue-100" :
            "bg-emerald-50 text-emerald-700 border-emerald-100"
          )}>
            {order.status}
          </div>
        </div>

        <div className="p-5 flex-grow space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 w-4">{item.quantity}x</span>
                  <span className="text-[13px] font-medium text-slate-700">{item.menu_item_name}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-500">₹{parseFloat(item.subtotal).toLocaleString()}</span>
              </div>
            ))}
        </div>

        <div className="p-5 bg-slate-50/30 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">₹{parseFloat(order.total_amount).toLocaleString()}</p>
            </div>
            <select
              disabled={isProcessing}
              value={paymentMethods[order.id] || 'CASH'}
              onChange={(e) => setPaymentMethods({ ...paymentMethods, [order.id]: e.target.value })}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="UPI">ONLINE</option>
            </select>
          </div>
          {order.order_type === 'TAKEAWAY' && order.status === 'BILLED' ? (
            <button
              onClick={() => handleHandover(order.id)}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Handed Over
            </button>
          ) : (
            <button
              disabled={isProcessing}
              onClick={() => handleGenerateBill(order.id, false, order)}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : 'Complete & Generate Bill'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            Real-time system monitoring active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openTakeawayOrder}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Quick Takeaway
          </button>
          <button
            onClick={() => { setLoading(true); fetchDashboardData(); }}
            className="p-2.5 text-slate-500 hover:text-primary-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                 <h3 className="text-2xl font-bold text-slate-900">{item.value}</h3>
                 <span className="text-[11px] text-slate-400 font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-1 mt-3">
                 <span className={cn(
                   "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded",
                   item.trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                 )}>
                   {item.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                   {item.change}
                 </span>
                 <span className="text-[10px] text-slate-400 font-medium">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <item.icon className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Floor Management */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-slate-800 text-[14px] uppercase tracking-wider">Floor Management</h3>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Free</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Occupied</span>
             </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {Object.entries(tablesBySection).map(([section, tables]) => (
            <div key={section} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{section}</span>
                <div className="h-px bg-slate-100 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => openTableOrder(table.id, table.number)}
                    className={cn(
                      "group aspect-square rounded-xl flex flex-col items-center justify-center border transition-all relative shadow-sm",
                      table.status === 'FREE' ? "bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:bg-primary-50/30" :
                      table.status === 'OCCUPIED' ? "bg-primary-600 border-primary-600 text-white font-bold shadow-primary-200/50 shadow-lg" :
                      "bg-amber-500 border-amber-500 text-white"
                    )}
                  >
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider mb-0.5", table.status === 'FREE' ? "text-slate-400" : "text-primary-100")}>Table</span>
                    <span className="text-xl font-bold tracking-tight">{table.number}</span>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-2 transition-all",
                      table.status === 'FREE' ? "bg-slate-200 group-hover:bg-primary-400" :
                      table.status === 'OCCUPIED' ? "bg-white animate-pulse" :
                      "bg-white"
                    )}></div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dine-in Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-sm shadow-primary-200 animate-pulse"></div>
               <h2 className="font-bold text-slate-900 text-[15px] tracking-tight uppercase">Live Table Orders</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {activeOrders.filter(o => o.order_type === 'DINE_IN').length} Active
            </span>
          </div>

          {activeOrders.filter(o => o.order_type === 'DINE_IN').length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeOrders.filter(o => o.order_type === 'DINE_IN').map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  paymentMethods={paymentMethods}
                  setPaymentMethods={setPaymentMethods}
                  handleGenerateBill={handleGenerateBill}
                  handleHandover={handleHandover}
                  processingIds={processingIds}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <Utensils className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider">No active table orders</p>
            </div>
          )}
        </div>

        {/* Takeaway Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <ShoppingBag className="w-4 h-4 text-slate-900" />
               <h2 className="font-bold text-slate-900 text-[15px] tracking-tight uppercase">Active Takeaway</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {activeOrders.filter(o => o.order_type === 'TAKEAWAY').length} Orders
            </span>
          </div>

          {activeOrders.filter(o => o.order_type === 'TAKEAWAY').length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeOrders.filter(o => o.order_type === 'TAKEAWAY').map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  paymentMethods={paymentMethods}
                  setPaymentMethods={setPaymentMethods}
                  handleGenerateBill={handleGenerateBill}
                  handleHandover={handleHandover}
                  processingIds={processingIds}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <ShoppingBag className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider">No active takeaway</p>
            </div>
          )}
        </div>
      </div>

      <OrderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tableId={drawerConfig.tableId}
        tableName={drawerConfig.tableName}
        isTakeaway={drawerConfig.isTakeaway}
        onOrderPlaced={onOrderPlacedHandler}
      />
    </div>
  );
}
