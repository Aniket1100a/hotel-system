import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Clock, CheckCircle, Loader2, RefreshCcw, Utensils, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  note: string;
}

interface KOT {
  id: number;
  number: number;
  table_number: string;
  items: OrderItem[];
  created_at: string;
}

export default function KitchenDisplay() {
  const [kots, setKots] = useState<KOT[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchKOTs = async () => {
    try {
      const res = await api.get('/orders/kots/');
      setKots(res.data);
    } catch (err) {
      console.error("Failed to fetch KOTs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKOTs();
    const interval = setInterval(fetchKOTs, 10000); // Polling every 10s for kitchen
    return () => clearInterval(interval);
  }, []);

  const handleMarkReady = async (itemId: number) => {
    setUpdatingId(itemId);
    try {
      await api.post(`/orders/items/${itemId}/mark_ready/`);
      fetchKOTs();
    } catch (err) {
      console.error("Failed to mark item ready", err);
      alert("Error marking item ready");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Kitchen Display System</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real-time KOT display. Mark items as ready for pickup.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => { setLoading(true); fetchKOTs(); }}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100 flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            {kots.length} Active Tickets
          </div>
        </div>
      </div>

      {loading && kots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Listening for new orders...</p>
        </div>
      ) : kots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kots.map((kot) => (
            <div key={kot.id} className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col h-full overflow-hidden transition-all hover:border-indigo-200">
              <div className="px-5 py-4 border-b-2 border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                    {kot.table_number}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 tracking-tight text-lg">KOT #{kot.number}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                      <Clock className="w-3 h-3" />
                      {new Date(kot.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-grow space-y-4">
                {kot.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between group">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs border border-slate-200">
                          {item.quantity}
                        </span>
                        <span className="font-bold text-slate-800 tracking-tight">{item.menu_item_name}</span>
                        {item.status === 'READY' && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      {item.note && (
                        <p className="mt-1 ml-8 text-xs text-rose-500 font-bold italic flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                    {item.status !== 'READY' && (
                      <button
                        onClick={() => handleMarkReady(item.id)}
                        disabled={updatingId === item.id}
                        className="opacity-0 group-hover:opacity-100 ml-4 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ready'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   {kot.items.every(i => i.status === 'READY') ? 'All Items Ready' : 'In Preparation'}
                 </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <CheckCircle className="w-16 h-16 text-slate-100 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No Pending Orders</h3>
          <p className="text-slate-500 mt-2">Kitchen is all caught up!</p>
        </div>
      )}
    </div>
  );
}
