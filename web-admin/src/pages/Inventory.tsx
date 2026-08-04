import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Package, Plus, Trash2, Search, Loader2, X, AlertTriangle, ArrowDown, ArrowUp, History, ClipboardList, Paperclip, Image as ImageIcon, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  current_stock: string;
  min_stock_level: string;
  price_per_unit: string | null;
  is_low_stock: boolean;
}

interface StockLog {
  id: number;
  item_name: string;
  quantity: string;
  change_type: string;
  user_name: string;
  notes: string;
  attachment: string | null;
  created_at: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'logs'>('stock');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    unit: 'KG',
    current_stock: '0',
    min_stock_level: '5',
    price_per_unit: '',
  });

  const [updateForm, setUpdateForm] = useState({
    quantity: '',
    change_type: 'PURCHASE',
    notes: '',
  });
  const [billAttachment, setBillAttachment] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, logsRes] = await Promise.all([
        api.get('/inventory/items/'),
        api.get('/inventory/logs/')
      ]);
      setItems(itemsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/items/', itemForm);
      setIsItemModalOpen(false);
      setItemForm({ name: '', unit: 'KG', current_stock: '0', min_stock_level: '5', price_per_unit: '' });
      fetchData();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    let finalQty = parseFloat(updateForm.quantity);
    if ((updateForm.change_type === 'USAGE' || updateForm.change_type === 'WASTE') && finalQty > 0) {
        finalQty = -finalQty;
    }

    try {
      const data = new FormData();
      data.append('quantity', finalQty.toString());
      data.append('change_type', updateForm.change_type);
      data.append('notes', updateForm.notes);
      if (billAttachment) {
        data.append('attachment', billAttachment);
      }

      await api.post(`/inventory/items/${selectedItem.id}/update_stock/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsUpdateModalOpen(false);
      setUpdateForm({ quantity: '', change_type: 'USAGE', notes: '' });
      setBillAttachment(null);
      fetchData();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Delete this inventory item?")) return;
    try {
      await api.delete(`/inventory/items/${id}/`);
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock & Inventory</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Monitor raw materials, usage patterns and procurement logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsItemModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center p-1 bg-slate-50 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={cn(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'stock' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Package className="w-4 h-4" />
            Active Stock
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'logs' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <History className="w-4 h-4" />
            Audit History
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter materials..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Synchronizing inventory data...</p>
          </div>
        ) : activeTab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Material Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Threshold</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                             <ClipboardList className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-800">{item.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                          {parseFloat(item.current_stock).toLocaleString()} <span className="text-[11px] text-slate-400">{item.unit}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-[13px] font-semibold text-slate-500">
                           {parseFloat(item.min_stock_level).toLocaleString()} {item.unit}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.is_low_stock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Refill Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedItem(item); setIsUpdateModalOpen(true); }}
                            className="text-[12px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Update Stock
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-12 h-12 text-slate-100 mb-4" />
                        <h3 className="text-slate-800 font-bold">No inventory items</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Start tracking your raw materials here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Change</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaction Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evidence</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[12px] text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-slate-800">{log.item_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex items-center gap-1 text-[14px] font-bold",
                        parseFloat(log.quantity) > 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {parseFloat(log.quantity) > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(parseFloat(log.quantity)).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {log.change_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.attachment ? (
                          <a
                              href={log.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 hover:bg-primary-100 transition-all"
                          >
                              <ImageIcon className="w-3.5 h-3.5" />
                              VIEW BILL
                          </a>
                      ) : (
                          <span className="text-[11px] text-slate-300 italic">No Attachment</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {log.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-semibold text-slate-600">{log.user_name}</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">Register Inventory Item</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddItem} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Material Name</label>
                  <input
                    required
                    placeholder="e.g. Basmati Rice"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={itemForm.name}
                    onChange={e => setItemForm({...itemForm, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Measurement Unit</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none appearance-none"
                      value={itemForm.unit}
                      onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                    >
                      <option value="KG">Kilogram (kg)</option>
                      <option value="G">Gram (g)</option>
                      <option value="L">Litre (L)</option>
                      <option value="ML">Millilitre (ml)</option>
                      <option value="PC">Piece (pc)</option>
                      <option value="PKT">Packet</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Initial Opening Stock</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={itemForm.current_stock}
                      onChange={e => setItemForm({...itemForm, current_stock: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Alert Threshold (Minimum Stock)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={itemForm.min_stock_level}
                    onChange={e => setItemForm({...itemForm, min_stock_level: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                >
                  Create Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUpdateModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-[#1e293b] text-[18px]">Stock Adjustment: {selectedItem.name.toLowerCase()}</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdateStock} className="p-8 space-y-6 bg-white">
              <div className="bg-[#f0f9ff] p-6 rounded-3xl border border-[#e0f2fe] transition-all hover:shadow-inner">
                <p className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-[0.15em] mb-2">Available On-Hand</p>
                <p className="text-3xl font-black text-[#0369a1] tracking-tight">
                  {parseFloat(selectedItem.current_stock).toLocaleString()} <span className="text-[16px] font-bold uppercase opacity-80">{selectedItem.unit}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.12em] ml-1">Quantity</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-700 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm"
                    value={updateForm.quantity}
                    onChange={e => setUpdateForm({...updateForm, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.12em] ml-1">Adjustment Type</label>
                  <div className="relative group">
                    <select
                      className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-700 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none appearance-none transition-all cursor-pointer shadow-sm"
                      value={updateForm.change_type}
                      onChange={e => setUpdateForm({...updateForm, change_type: e.target.value})}
                    >
                      <option value="PURCHASE">Procurement (+)</option>
                      <option value="USAGE">Consumption (-)</option>
                      <option value="WASTE">Wastage (-)</option>
                      <option value="ADJUSTMENT">Reconciliation (+/-)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.12em] ml-1">Transaction Notes</label>
                <textarea
                  className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-600 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all min-h-[100px] shadow-sm"
                  placeholder="Reason for adjustment..."
                  value={updateForm.notes}
                  onChange={e => setUpdateForm({...updateForm, notes: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.12em] ml-1">Document / Receipt Evidence</label>
                <div className="relative group/file">
                    <div className={cn(
                        "w-full px-6 py-6 bg-[#f8fafc] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all",
                        billAttachment ? "border-sky-500 bg-sky-50/50" : "border-slate-200 group-hover/file:border-sky-300"
                    )}>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 mb-1">
                          <Paperclip className={cn("w-6 h-6", billAttachment ? "text-sky-600" : "text-slate-400")} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 truncate max-w-[250px]">
                            {billAttachment ? billAttachment.name : "Click or drag file to upload..."}
                        </span>
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setBillAttachment(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0369a1] hover:bg-[#075985] text-white font-black py-4.5 rounded-2xl shadow-xl shadow-sky-900/10 transition-all active:scale-[0.98] text-[15px] tracking-wide"
              >
                Commit Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
