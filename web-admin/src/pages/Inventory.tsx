import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Package, Plus, Trash2, Search, Loader2, X, AlertTriangle, ArrowDown, ArrowUp, History, ClipboardList, Paperclip, Image as ImageIcon } from 'lucide-react';
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
    change_type: 'USAGE',
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
      alert("Failed to add inventory item.");
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    // For usage/waste, we negate the quantity if user entered positive
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
      alert("Failed to update stock.");
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Delete this inventory item? All history will be lost.")) return;
    try {
      await api.delete(`/inventory/items/${id}/`);
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Inventory Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track raw materials, ingredients, and store supplies.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsItemModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add New Item
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('stock')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'stock'
                  ? "border-indigo-50 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <Package className="w-4 h-4" />
              Stock Levels
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'logs'
                  ? "border-indigo-50 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <History className="w-4 h-4" />
              Stock History
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : activeTab === 'stock' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Min Level</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {parseFloat(item.current_stock).toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {parseFloat(item.min_stock_level).toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.is_low_stock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => { setSelectedItem(item); setIsUpdateModalOpen(true); }}
                          className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors border border-indigo-100"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No inventory items yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Bill</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {log.item_name}
                      </td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm font-black",
                        parseFloat(log.quantity) > 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {parseFloat(log.quantity) > 0 ? '+' : ''}{parseFloat(log.quantity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {log.change_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.attachment ? (
                            <a
                                href={log.attachment}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100"
                            >
                                <ImageIcon className="w-3 h-3" />
                                VIEW
                            </a>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-200 uppercase">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {log.user_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add Inventory Item</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Item Name</label>
                <input
                  required
                  placeholder="e.g. Paneer"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={itemForm.name}
                  onChange={e => setItemForm({...itemForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Unit</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Initial Stock</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={itemForm.current_stock}
                    onChange={e => setItemForm({...itemForm, current_stock: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Minimum Level (for alert)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={itemForm.min_stock_level}
                  onChange={e => setItemForm({...itemForm, min_stock_level: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg mt-4 transition-all">
                Create Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {isUpdateModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Update {selectedItem.name}</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="p-6 space-y-4">
              <div className="bg-indigo-50 p-4 rounded-2xl mb-4 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Current Balance</p>
                <p className="text-2xl font-black text-indigo-700">{parseFloat(selectedItem.current_stock).toLocaleString()} {selectedItem.unit}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Quantity</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={updateForm.quantity}
                    onChange={e => setUpdateForm({...updateForm, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Action</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={updateForm.change_type}
                    onChange={e => setUpdateForm({...updateForm, change_type: e.target.value})}
                  >
                    <option value="USAGE">Use Stock (-)</option>
                    <option value="PURCHASE">Buy New (+)</option>
                    <option value="WASTE">Wastage (-)</option>
                    <option value="ADJUSTMENT">Adjustment (+/-)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Notes (optional)</label>
                <textarea
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  rows={2}
                  value={updateForm.notes}
                  onChange={e => setUpdateForm({...updateForm, notes: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Attach Bill (Optional)</label>
                <div className="relative">
                    <div className={cn(
                        "w-full px-4 py-3 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center gap-3 transition-all",
                        billAttachment ? "border-indigo-500 bg-indigo-50/30" : "border-slate-100 hover:border-slate-200"
                    )}>
                        <Paperclip className={cn("w-4 h-4", billAttachment ? "text-indigo-600" : "text-slate-300")} />
                        <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]">
                            {billAttachment ? billAttachment.name : "Choose file..."}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setBillAttachment(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg mt-4 transition-all">
                Update Balance
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
