import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MenuManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        api.get('/menu/categories/'),
        api.get('/menu/items/')
      ]);
      setCategories(catsRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error("Error fetching menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Menu Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your categories and menu items.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
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
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors",
                activeTab === 'items'
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              Menu Items
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors",
                activeTab === 'categories'
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              Categories
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center mb-6">
            <div className="relative flex-grow max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 border-slate-200 rounded-lg py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                placeholder={`Search ${activeTab}...`}
              />
            </div>
          </div>

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
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.category?.name || item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${item.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                          <button className="text-rose-600 hover:text-rose-900"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                        No items found. Create one to get started.
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
                  <div key={cat.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-indigo-300 transition-colors bg-white shadow-sm">
                    <span className="font-medium text-slate-900">{cat.name}</span>
                    <div className="flex space-x-2">
                      <button className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg">
                  No categories found. Create one to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
