import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Plus, Edit2, Trash2, Loader2, X, UtensilsCrossed, LayoutGrid, CheckCircle2, Package } from 'lucide-react';
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
      alert("Failed to save item.");
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
      alert("Failed to save category.");
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
      const detail = error.response?.data?.detail || "This item is likely linked to existing orders and cannot be deleted.";
      alert(`Failed to delete: ${detail}`);
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!window.confirm("Delete this category? (Items in it will be deleted too!)")) return;
    try {
      await api.delete(`/menu/categories/${id}/`);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Ensure no items are using it or it might be protected.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Menu Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your categories and menu items for Hotel Chaturthi.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => activeTab === 'items' ? openItemModal() : openCatModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add {activeTab === 'items' ? 'Item' : 'Category'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('items')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'items'
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Menu Items
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'categories'
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Categories
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : activeTab === 'items' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Product</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-2 h-2 rounded-full", item.is_veg ? "bg-emerald-500" : "bg-rose-500")} />
                             <span className="text-sm font-medium text-slate-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {typeof item.category === 'object' ? item.category.name : categories.find(c => c.id === item.category)?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">₹{parseFloat(item.price).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.linked_inventory_item ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              <Package className="w-3 h-3" />
                              {inventoryItems.find(i => i.id === item.linked_inventory_item)?.name || 'Linked'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Not Linked</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openItemModal(item)}
                            className="text-slate-400 hover:text-indigo-600 p-1 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                        <h3 className="text-sm font-bold text-slate-900">No items found</h3>
                        <p className="text-sm text-slate-500 mt-1">Start by adding delicious food to your menu.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div key={cat.id} className="group border-2 border-slate-50 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-100 hover:bg-indigo-50/30 transition-all bg-white shadow-sm">
                    <span className="font-bold text-slate-700 tracking-tight">{cat.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openCatModal(cat)}
                        className="text-slate-300 hover:text-indigo-600 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCat(cat.id)}
                        className="text-slate-300 hover:text-rose-600 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                  <LayoutGrid className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                  <h3 className="text-sm font-bold text-slate-900">No categories set up</h3>
                  <p className="text-sm text-slate-500 mt-1">Create your first category (e.g. Punjabi Dishes).</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
              <button onClick={closeItemModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Dish Name</label>
                <input
                  required
                  placeholder="e.g. Dal Tadka"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={itemForm.name}
                  onChange={e => setItemForm({...itemForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={itemForm.category}
                    onChange={e => setItemForm({...itemForm, category: e.target.value})}
                  >
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Price (₹)</label>
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={itemForm.price}
                    onChange={e => setItemForm({...itemForm, price: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Link Inventory (Optional)</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={itemForm.linked_inventory_item}
                    onChange={e => {
                        const val = e.target.value;
                        setItemForm({
                            ...itemForm,
                            linked_inventory_item: val,
                            // Auto-set deduct quantity to 1.00 if a product is linked
                            inventory_deduction_quantity: val ? '1.00' : '0.00'
                        });
                    }}
                  >
                    <option value="">No Link</option>
                    {inventoryItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Deduct Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={itemForm.inventory_deduction_quantity}
                    onChange={e => setItemForm({...itemForm, inventory_deduction_quantity: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Pure Veg Dish</span>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
              >
                {editingItem ? 'Update Item' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">{editingCat ? 'Edit' : 'New'} Category</h3>
              <button onClick={closeCatModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddCat} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category Name</label>
                <input
                  required
                  placeholder="e.g. Punjabi Dishes"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={catForm.name}
                  onChange={e => setCatForm({...catForm, name: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
              >
                {editingCat ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
