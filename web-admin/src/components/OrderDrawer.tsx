import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { X, Search, ShoppingCart, Plus, Minus, Trash2, Loader2, Utensils, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number | null;
  tableName: string | null;
  onOrderPlaced: (newOrder?: any) => void;
  isTakeaway?: boolean;
}

export default function OrderDrawer({ isOpen, onClose, tableId, tableName, onOrderPlaced, isTakeaway = false }: OrderDrawerProps) {
  const [menu, setMenu] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{[key: number]: {name: string, price: number, quantity: number}}>({});
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
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
        quantity: (prev[item.id]?.quantity || 0) + 1
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

  const totalAmount = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (Object.keys(cart).length === 0) return;

    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([id, data]) => ({
        menu_item: parseInt(id),
        quantity: data.quantity
      }));

      const res = await api.post('/orders/', {
        table: tableId,
        order_type: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
        items: items
      });

      setCart({});
      onOrderPlaced(res.data);
      onClose();
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) && item.is_available
  );

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
        "fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              {isTakeaway ? <Store className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
                {isTakeaway ? 'Takeaway Order' : `Table #${tableName}`}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Order Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Menu Search */}
          <div className="p-6 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search food or beverages..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Menu List */}
            <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
              ) : (
                filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full text-left bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group active:scale-95"
                  >
                    <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                    <p className="text-indigo-600 font-black text-xs mt-1">₹{item.price}</p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-indigo-500" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Cart */}
            <div className="w-1/2 flex flex-col bg-white">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Cart</span>
                <ShoppingCart className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.entries(cart).map(([id, data]) => (
                  <div key={id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-800 leading-tight flex-1">{data.name}</p>
                      <button onClick={() => deleteFromCart(parseInt(id))} className="text-slate-300 hover:text-rose-500 ml-2">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                        <button onClick={() => removeFromCart(parseInt(id))} className="p-1 hover:bg-white rounded shadow-sm transition-all"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-black w-4 text-center">{data.quantity}</span>
                        <button onClick={() => addToCart({id, name: data.name, price: data.price})} className="p-1 hover:bg-white rounded shadow-sm transition-all"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="text-xs font-bold text-slate-600">₹{data.price * data.quantity}</p>
                    </div>
                  </div>
                ))}
                {Object.keys(cart).length === 0 && (
                   <div className="text-center py-20">
                     <ShoppingCart className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cart is empty</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 space-y-4 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase">Total Payable</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{totalAmount.toLocaleString()}</span>
          </div>
          <button
            disabled={Object.keys(cart).length === 0 || placing}
            onClick={handlePlaceOrder}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {placing ? <Loader2 className="animate-spin" /> : 'Confirm & Place Order'}
          </button>
        </div>
      </aside>
    </>
  );
}
