import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Plus, Edit2, Trash2, Loader2, X, UtensilsCrossed, LayoutGrid, CheckCircle2, Package, Search, Filter, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  category: number | Category;
  price: string;
  is_veg: boolean;
  linked_inventory_item?: number | null;
  inventory_deduction_quantity?: string;
}

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    price: '',
    is_veg: true,
    linked_inventory_item: '',
    inventory_deduction_quantity: '1.00',
  });

  const [catForm, setCatForm] = useState({
    name: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes, invRes] = await Promise.all([
        api.get('/menu/categories/'),
        api.get('/menu/items/'),
        api.get('/inventory/items/')
      ]);
      setCategories(catsRes.data);
      setItems(itemsRes.data);
      setInventoryItems(invRes.data);
    } catch (error) {
      console.error("Error fetching menu data:", error);
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
      const payload = { ...itemForm };
      if (!payload.linked_inventory_item) {
        (payload as any).linked_inventory_item = null;
      }

      if (editingItem) {
        await api.patch(`/menu/items/${editingItem.id}/`, payload);
      } else {
        await api.post('/menu/items/', payload);
      }

      closeItemModal();
      fetchData();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await api.patch(`/menu/categories/${editingCat.id}/`, catForm);
      } else {
        await api.post('/menu/categories/', catForm);
      }
      closeCatModal();
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const openItemModal = (item: MenuItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        category: typeof item.category === 'object' ? item.category.id.toString() : item.category.toString(),
        price: item.price,
        is_veg: item.is_veg,
        linked_inventory_item: item.linked_inventory_item?.toString() || '',
        inventory_deduction_quantity: item.inventory_deduction_quantity?.toString() || '1.00',
      });
    } else {
      setEditingItem(null);
      setItemForm({ name: '', category: '', price: '', is_veg: true, linked_inventory_item: '', inventory_deduction_quantity: '1.00' });
    }
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const openCatModal = (cat: Category | null = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name });
    } else {
      setEditingCat(null);
      setCatForm({ name: '' });
    }
    setIsCatModalOpen(true);
  };

  const closeCatModal = () => {
    setIsCatModalOpen(false);
    setEditingCat(null);
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/menu/items/${id}/`);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting item:", error);
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/menu/categories/${id}/`);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting category:", error);
    }
  };

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase().trim();
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Menu & Catalog</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Configure your digital menu, prices and inventory links.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeTab === 'items' ? openItemModal() : openCatModal()}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'items' ? 'New Item' : 'Category'}
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center p-1 bg-slate-50 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={cn(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'items' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'categories' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Categories
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Synchronizing catalog...</p>
          </div>
        ) : activeTab === 'items' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inventory Hook</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border",
                            item.is_veg ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {item.is_veg ? 'V' : 'NV'}
                          </div>
                          <div>
                             <p className="text-[14px] font-bold text-slate-800">{item.name}</p>
                             <p className="text-[11px] text-slate-400 font-medium">SKU: {item.id.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {typeof item.category === 'object' ? item.category.name : categories.find(c => c.id === item.category)?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-bold text-slate-900">₹{Math.round(parseFloat(item.price)).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.linked_inventory_item ? (
                          <div className="flex items-center gap-2 text-primary-600">
                            <Package className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-bold">Linked</span>
                            <span className="text-[10px] text-slate-400 font-medium">({item.inventory_deduction_quantity} qty)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-medium italic">Unlinked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openItemModal(item)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
                        <UtensilsCrossed className="w-12 h-12 text-slate-100 mb-4" />
                        <h3 className="text-slate-800 font-bold">No products found</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Try refining your search or add a new item.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-primary-200 hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                      <LayoutGrid className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800 text-[14px]">{cat.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Active Category</p>
                   </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openCatModal(cat)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteCat(cat.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">{editingItem ? 'Edit Product' : 'Create New Product'}</h3>
              <button onClick={closeItemModal} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddItem} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Product Name</label>
                  <input
                    required
                    placeholder="e.g. Signature Dal Tadka"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={itemForm.name}
                    onChange={e => setItemForm({...itemForm, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none"
                      value={itemForm.category}
                      onChange={e => setItemForm({...itemForm, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Price (₹)</label>
                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={itemForm.price}
                      onChange={e => setItemForm({...itemForm, price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Package className="w-3.5 h-3.5 text-primary-500" />
                     Inventory Integration
                   </p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Link Stock Item</label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
                          value={itemForm.linked_inventory_item}
                          onChange={e => setItemForm({...itemForm, linked_inventory_item: e.target.value, inventory_deduction_quantity: e.target.value ? '1.00' : '0.00'})}
                        >
                          <option value="">No Link</option>
                          {inventoryItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Deduct per Order</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
                          value={itemForm.inventory_deduction_quantity}
                          onChange={e => setItemForm({...itemForm, inventory_deduction_quantity: e.target.value})}
                        />
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-3 p-1">
                   <button
                    type="button"
                    onClick={() => setItemForm({...itemForm, is_veg: !itemForm.is_veg})}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold transition-all border",
                      itemForm.is_veg ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}
                   >
                     <div className={cn("w-2 h-2 rounded-full", itemForm.is_veg ? "bg-emerald-500" : "bg-rose-500")}></div>
                     {itemForm.is_veg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                   </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                >
                  {editingItem ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">{editingCat ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={closeCatModal} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddCat} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category Label</label>
                <input
                  required
                  placeholder="e.g. Main Course"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  value={catForm.name}
                  onChange={e => setCatForm({...catForm, name: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
              >
                {editingCat ? 'Update Label' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
