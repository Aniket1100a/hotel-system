import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Users, Utensils, ReceiptText, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Loader2, RefreshCcw, Receipt, LayoutGrid, Plus, ShoppingBag } from 'lucide-react';
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

      // Group tables by section
      const groups = tables.reduce((acc: SectionGroup, table: Table) => {
        const section = table.section_name || 'Unassigned';
        if (!acc[section]) acc[section] = [];
        acc[section].push(table);
        return acc;
      }, {});

      // Filter for active orders
      const active = orders.filter((o: Order) =>
        ['PENDING', 'PREPARING', 'SERVED'].includes(o.status) ||
        (o.order_type === 'TAKEAWAY' && o.status === 'BILLED' && !o.is_handed_over)
      );

      // Get Today's Date String for filtering
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

      // Calculate today's revenue from BILLED orders
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
    const interval = setInterval(fetchDashboardData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleGenerateBill = async (orderId: number, skipConfirm = false, orderData?: Order) => {
    // Prevent duplicate processing
    if (processingIds.has(orderId)) return;

    // Use passed orderData if available, otherwise find in state
    const order = orderData || activeOrders.find(o => o.id === orderId);

    // If order is already billed, just return
    if (order?.status === 'BILLED') return;

    const isTakeaway = order?.order_type === 'TAKEAWAY';
    const method = paymentMethods[orderId] || 'CASH';

    // No confirmation for Takeaway (always immediate) or if skipConfirm is true
    if (!skipConfirm && !isTakeaway) {
      if (!window.confirm(`Generate ${method} bill for this order and free the table?`)) return;
    }

    // Set processing status
    setProcessingIds(prev => new Set(prev).add(orderId));

    try {
      const res = await api.post('/billing/', {
        order: orderId,
        payment_method: method
      });
      const invoice = res.data;

      // Use items from order data if available, otherwise fetch
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

      if (!skipConfirm) alert("Bill generated and table freed!");
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to generate bill:", err);
      if (!skipConfirm) alert("Error generating bill. Please try again.");
    } finally {
      // Clear processing status
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
      alert("Error processing handover.");
    }
  };

  const onOrderPlacedHandler = (newOrder?: any) => {
    // Update list immediately
    fetchDashboardData();

    const orderType = newOrder?.order_type || newOrder?.orderType;
    const orderId = newOrder?.id;

    if (orderId && orderType === 'TAKEAWAY') {
      // Immediate billing for takeaway
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
      value: `₹${stats.revenueToday.toLocaleString()}`,
      icon: ReceiptText,
      change: '+5.2%',
      changeType: 'positive',
    },
  ];

  // Helper Component for Order Cards to avoid repetition
  const OrderCard = ({ order, paymentMethods, setPaymentMethods, handleGenerateBill, handleHandover, processingIds }: any) => {
    const isProcessing = processingIds.has(order.id);

    return (
      <div className="bg-white rounded-[2rem] border-2 border-slate-50 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col hover:border-indigo-200 transition-all group">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg",
              order.order_type === 'TAKEAWAY' ? "bg-slate-800 text-white" : "bg-indigo-600 text-white"
            )}>
              {order.order_type === 'TAKEAWAY' ? <ShoppingBag className="w-6 h-6" /> : order.table_number}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {order.order_type === 'TAKEAWAY' ? 'Takeaway' : `Table Order`}
              </p>
              <h4 className="font-bold text-slate-800 tracking-tight">Order #{order.id}</h4>
            </div>
          </div>
          <span className={cn(
            "px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border-2",
            order.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
            order.status === 'PREPARING' ? "bg-blue-50 text-blue-600 border-blue-100" :
            "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {order.status}
          </span>
        </div>

        <div className="p-6 flex-grow space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-lg text-[10px] flex items-center justify-center font-black border border-slate-200">
                    {item.quantity}
                  </span>
                  <span className="text-slate-800 font-bold text-sm tracking-tight">{item.menu_item_name}</span>
                </div>
                <span className="text-slate-400 font-bold text-xs">₹{parseFloat(item.subtotal).toLocaleString()}</span>
              </div>
            ))}
        </div>

        <div className="px-6 py-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{parseFloat(order.total_amount).toLocaleString()}</p>
            </div>
            <select
              disabled={isProcessing}
              value={paymentMethods[order.id] || 'CASH'}
              onChange={(e) => setPaymentMethods({ ...paymentMethods, [order.id]: e.target.value })}
              className="bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none focus:border-indigo-500 shadow-sm disabled:opacity-50"
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="UPI">ONLINE</option>
            </select>
          </div>
          {order.order_type === 'TAKEAWAY' && order.status === 'BILLED' ? (
            <button
              onClick={() => handleHandover(order.id)}
              className="w-full inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[1.25rem] text-sm font-black shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-5 h-5" />
              Hand Over Food
            </button>
          ) : (
            <button
              disabled={isProcessing}
              onClick={() => handleGenerateBill(order.id, false, order)}
              className="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-4 rounded-[1.25rem] text-sm font-black shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] group-hover:bg-indigo-700"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
              {isProcessing ? 'Processing...' : 'Complete & Bill'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-tight">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium italic">
            Monitoring {activeOrders.length} active orders across the floor.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={openTakeawayOrder}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            New Takeaway
          </button>
          <button
            onClick={() => { setLoading(true); fetchDashboardData(); }}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-colors border border-slate-100 bg-white shadow-sm"
            title="Refresh Data"
          >
            <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm transition-all hover:shadow-md hover:border-indigo-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <item.icon className="w-6 h-6 text-slate-600" />
              </div>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest flex items-center px-2 py-1 rounded-full",
                item.changeType === 'positive' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {item.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {item.change}
              </p>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Table Sections Grid */}
      <div className="mt-10">
        <h3 className="font-black text-slate-800 flex items-center gap-2 mb-8 uppercase tracking-tight">
          <LayoutGrid className="w-5 h-5 text-indigo-500" />
          Floor Management
        </h3>

        <div className="space-y-12">
          {Object.entries(tablesBySection).map(([section, tables]) => (
            <div key={section} className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{section}</span>
                <div className="h-px bg-slate-100 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className={cn(
                      "group aspect-square rounded-[2rem] flex flex-col items-center justify-center border-2 transition-all relative shadow-sm overflow-hidden",
                      table.status === 'FREE' ? "bg-white border-slate-100 text-slate-900 hover:border-indigo-200" :
                      table.status === 'OCCUPIED' ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-indigo-100 shadow-xl" :
                      "bg-amber-400 border-amber-400 text-white shadow-amber-50"
                    )}
                  >
                    <span className={cn("text-[10px] font-black mb-1 uppercase tracking-widest", table.status === 'FREE' ? "text-slate-400" : "text-indigo-100")}>Table</span>
                    <span className="text-3xl font-black tracking-tighter">{table.number}</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-3",
                      table.status === 'FREE' ? "bg-slate-200" :
                      table.status === 'OCCUPIED' ? "bg-white animate-pulse" :
                      "bg-white"
                    )}></div>

                    {/* Hover Order Button */}
                    <button
                      onClick={() => openTableOrder(table.id, table.number)}
                      className="absolute inset-0 bg-indigo-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                    >
                      <Plus className="w-8 h-8" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 space-y-12">
        {/* Dine-in Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
              Live Table Orders
            </h2>
          </div>

          {activeOrders.filter(o => o.order_type === 'DINE_IN').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center shadow-inner">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No active table orders</p>
            </div>
          )}
        </div>

        {/* Takeaway Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
              <ShoppingBag className="w-5 h-5 text-slate-800" />
              Active Takeaway
            </h2>
          </div>

          {activeOrders.filter(o => o.order_type === 'TAKEAWAY').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center shadow-inner">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No active takeaway orders</p>
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
