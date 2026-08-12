import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Clock, CheckCircle2, Loader2, Utensils, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  status: string;
}

interface Order {
  id: number;
  table_number: string | null;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  status: string;
  items: OrderItem[];
  created_at: string;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItems, setProcessingIds] = useState<Set<number>>(new Set());

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/?status=PENDING,PREPARING');
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch kitchen orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const markItemReady = async (itemId: number) => {
    if (processingItems.has(itemId)) return;
    setProcessingIds(prev => new Set(prev).add(itemId));
    try {
      await api.post(`/order-items/${itemId}/mark_ready/`);
      fetchOrders();
    } catch (err) {
      console.error("Failed to mark item ready", err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Display System</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Manage live cooking orders and item status.</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="p-2.5 text-slate-500 hover:text-primary-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all"
        >
          <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-medium">Synchronizing orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {order.table_number || 'TA'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[14px]">Order #{order.id}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                  {order.status}
                </div>
              </div>

              <div className="p-5 flex-grow space-y-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md text-[11px] font-bold text-slate-600">
                         {item.quantity}
                       </span>
                       <span className={cn(
                         "text-[14px] font-semibold transition-colors",
                         item.status === 'READY' ? "text-slate-300 line-through" : "text-slate-700"
                       )}>
                         {item.menu_item_name}
                       </span>
                    </div>
                    {item.status !== 'READY' ? (
                      <button
                        onClick={() => markItemReady(item.id)}
                        disabled={processingItems.has(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        {processingItems.has(item.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Utensils className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-800 font-bold">No Pending Orders</h3>
              <p className="text-slate-400 text-sm font-medium">Kitchen is currently clear.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
