import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { X, Search, ShoppingCart, Plus, Minus, Trash2, Loader2, Utensils, Store, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number | null;
  tableName: string | null;
  onOrderPlaced: (newOrder?: any) => void;
  isTakeaway?: boolean;
  activeOrders?: any[]; // Added to sync split data
}

export default function OrderDrawer({ isOpen, onClose, tableId, tableName, onOrderPlaced, isTakeaway = false, activeOrders = [] }: OrderDrawerProps) {
  const [menu, setMenu] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [subTable, setSubTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<{[key: number]: {name: string, price: number, quantity: number, is_veg: boolean}}>({});
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [updatingHistoryId, setUpdatingHistoryId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'EDIT'>('NEW');

  // Synchronize history when split changes
  useEffect(() => {
    if (!tableId || isTakeaway) return;

    const splitOrder = activeOrders.find(o =>
      o.table === tableId && (o.sub_table || '') === subTable
    );

    if (splitOrder) {
      setHistoryItems(splitOrder.items || []);
      setCustomerName(splitOrder.customer_name || '');
    } else {
      setHistoryItems([]);
      setCustomerName('');
    }
    // Don't reset cart here, let the user keep their selection if they switch splits?
    // Actually, usually cart is per-table/split, but since this is a drawer it's safer to clear cart on split change too.
    setCart({});
  }, [subTable, activeOrders, tableId, isTakeaway]);

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
      setSubTable('');
      setCart({});
      setActiveTab('NEW');
    }
  }, [isOpen]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await api.get('/menu/items/');
      setMenu(res.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        name: item.name,
        price: parseFloat(item.price),
        quantity: (prev[item.id]?.quantity || 0) + 1,
        is_veg: item.is_veg
      }
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId].quantity > 1) {
        updated[itemId].quantity -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const deleteFromCart = (itemId: number) => {
    setCart(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const updateHistoryQuantity = async (item: any, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      return deleteHistoryItem(item.id);
    }

    setUpdatingHistoryId(item.id);
    try {
      await api.patch(`/orders/items/${item.id}/`, { quantity: newQty });
      onOrderPlaced(); // Trigger refresh in parent
    } catch (err) {
      console.error("Error updating history item:", err);
    } finally {
      setUpdatingHistoryId(null);
    }
  };

  const deleteHistoryItem = async (itemId: number) => {
    if (!window.confirm("Remove this item from the kitchen order?")) return;
    setUpdatingHistoryId(itemId);
    try {
      await api.delete(`/orders/items/${itemId}/`);
      onOrderPlaced(); // Trigger refresh in parent
    } catch (err) {
      console.error("Error deleting history item:", err);
    } finally {
      setUpdatingHistoryId(null);
    }
  };

  const cartTotal = Object.values(cart).reduce((sum, item: any) => sum + (item.price * item.quantity), 0);
  const historyTotal = historyItems.reduce((sum, item: any) => sum + parseFloat(item.subtotal), 0);

  const handlePlaceOrder = async () => {
    if (Object.keys(cart).length === 0) return;

    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([id, data]: [string, any]) => ({
        menu_item: parseInt(id),
        quantity: data.quantity
      }));

      const res = await api.post('/orders/', {
        table: tableId,
        sub_table: subTable.toUpperCase(),
        order_type: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
        items: items
      });

      setCart({});
      onOrderPlaced({ ...res.data, customer_name: customerName });
      onClose();
    } catch (err) {
      console.error("Error placing order:", err);
    } finally {
      setPlacing(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    const name = item.name.toLowerCase();

    // 1. Regular search (contains)
    if (name.includes(q)) return true;

    // 2. Initial-based Shortcut search (e.g. "pm" matches "Paneer Masala")
    if (q.length >= 2 && !q.includes(' ')) {
      const words = name.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= q.length) {
        let qIdx = 0;
        for (const word of words) {
          if (qIdx < q.length && word.startsWith(q[qIdx])) {
            qIdx++;
          }
        }
        if (qIdx === q.length) return true;
      }
    }

    return false;
  });

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100",
                isTakeaway ? "bg-slate-800" : "bg-primary-600"
            )}>
              {isTakeaway ? <Store className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-[18px] tracking-tight">
                {isTakeaway ? 'Takeaway Console' : `Table #${tableName}${subTable} Selection`}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Digital Order Interface</p>
            </div>
          </div>

          {!isTakeaway && (
            <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
               {['', 'A', 'B', 'C'].map((code) => (
                 <button
                   key={code}
                   onClick={() => setSubTable(code)}
                   className={cn(
                     "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                     subTable === code
                      ? "bg-white text-primary-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                   )}
                 >
                   {code === '' ? 'MAIN' : code}
                 </button>
               ))}
            </div>
          )}

          <button onClick={onClose} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Menu Side (Left) */}
          <div className="flex-1 flex flex-col border-r border-slate-100 bg-[#F8FAFC]">
            <div className="p-6 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item catalog..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">Syncing Menu...</p>
                </div>
              ) : (
                filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full text-left bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all group active:scale-95 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", item.is_veg ? "bg-emerald-500" : "bg-rose-500")}></div>
                        <div>
                            <p className="font-bold text-slate-800 text-[14px] leading-tight">{item.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">₹{item.price}</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                        <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart Side (Right) */}
          <div className="w-[320px] flex flex-col bg-white">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 shrink-0">
              <button
                onClick={() => setActiveTab('NEW')}
                className={cn(
                  "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                  activeTab === 'NEW' ? "text-primary-600 bg-primary-50/30" : "text-slate-400 hover:text-slate-600"
                )}
              >
                New Order
                {Object.keys(cart).length > 0 && (
                  <span className="absolute top-3 right-3 w-4 h-4 bg-primary-500 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white">
                    {Object.keys(cart).length}
                  </span>
                )}
                {activeTab === 'NEW' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
              </button>
              <button
                onClick={() => setActiveTab('EDIT')}
                className={cn(
                  "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                  activeTab === 'EDIT' ? "text-emerald-600 bg-emerald-50/30" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Edit Order
                {historyItems.length > 0 && (
                  <span className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white">
                    {historyItems.length}
                  </span>
                )}
                {activeTab === 'EDIT' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'NEW' ? (
                <>
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Cust. Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter guest name..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>

                  {/* Current Selection Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">New Selection</span>
                      <span className="text-[10px] font-bold text-slate-400">{Object.keys(cart).length} Items</span>
                    </div>

                    {Object.entries(cart).map(([id, data]: [string, any]) => (
                      <div key={id} className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                              <p className="text-[13px] font-bold text-slate-800 leading-tight">{data.name}</p>
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">₹{Math.round(data.price)} unit price</p>
                          </div>
                          <button onClick={() => deleteFromCart(parseInt(id))} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <button onClick={() => removeFromCart(parseInt(id))} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[13px] font-bold text-slate-700 w-6 text-center">{data.quantity}</span>
                            <button onClick={() => addToCart({id, name: data.name, price: data.price, is_veg: data.is_veg})} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[13px] font-bold text-slate-900">₹{(data.price * data.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    ))}

                    {Object.keys(cart).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <ShoppingCart className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cart is empty</p>
                        <p className="text-[10px] text-slate-300 font-medium mt-1 italic">Pick items from the menu <br/>to start a new dispatch.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* History Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Sent to Kitchen</span>
                      <span className="text-[10px] font-bold text-slate-400">₹{Math.round(historyTotal).toLocaleString()}</span>
                    </div>

                    {historyItems.length > 0 ? (
                      <div className="space-y-4">
                        {historyItems.map((item: any) => (
                          <div key={item.id} className="space-y-2.5 hover:bg-slate-50/50 p-3 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                  <p className="text-[12px] font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                                    {item.menu_item_name}
                                    <span className={cn(
                                      "text-[8px] px-1 rounded uppercase tracking-tighter font-black",
                                      item.status === 'READY' ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"
                                    )}>
                                      {item.status}
                                    </span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">₹{Math.round(parseFloat(item.price_at_order)).toLocaleString()} unit price</p>
                              </div>
                              <button
                                disabled={updatingHistoryId === item.id}
                                onClick={() => deleteHistoryItem(item.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between bg-emerald-50/30 p-2 rounded-xl border border-emerald-100/50">
                              <div className="flex items-center gap-3">
                                <button
                                  disabled={updatingHistoryId === item.id}
                                  onClick={() => updateHistoryQuantity(item, -1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[13px] font-bold text-slate-700 w-6 text-center">
                                  {updatingHistoryId === item.id ? '..' : item.quantity}
                                </span>
                                <button
                                  disabled={updatingHistoryId === item.id}
                                  onClick={() => updateHistoryQuantity(item, 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary-600 transition-all shadow-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[13px] font-bold text-slate-900">₹{Math.round(parseFloat(item.subtotal)).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <Utensils className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No history found</p>
                        <p className="text-[10px] text-slate-300 font-medium mt-1 italic">No items have been sent <br/>to the kitchen yet.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer / Summary */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Grand Total Payable</p>
                   <span className="text-2xl font-black text-slate-900 tracking-tight">₹{Math.round(cartTotal + historyTotal).toLocaleString()}</span>
                </div>
                {activeTab === 'NEW' && (
                  <div className="text-right">
                     <p className="text-[9px] font-bold text-primary-500 uppercase tracking-widest">To Dispatch</p>
                     <p className="text-sm font-bold text-slate-700">₹{Math.round(cartTotal).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {activeTab === 'NEW' && (
                <button
                  disabled={Object.keys(cart).length === 0 || placing}
                  onClick={handlePlaceOrder}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  {placing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                      <>
                          <span>Dispatch Selection</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
