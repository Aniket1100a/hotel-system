import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Plus, Edit2, Trash2, Loader2, X, LayoutGrid, Square, Users, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: number;
  name: string;
  display_order: number;
}

interface Table {
  id: number;
  number: string;
  capacity: number;
  status: string;
  section: number | null;
  section_name: string;
}

export default function TableManagement() {
  const [sections, setSections] = useState<Section[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tables' | 'sections'>('tables');

  // Modal states
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Form states
  const [tableForm, setTableForm] = useState({
    number: '',
    capacity: 4,
    section: '',
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    display_order: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, tablesRes] = await Promise.all([
        api.get('/tables/sections/'),
        api.get('/tables/'),
      ]);
      setSections(secRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        number: tableForm.number,
        capacity: Number(tableForm.capacity),
        section: tableForm.section ? Number(tableForm.section) : null,
      };

      if (editingTable) {
        await api.patch(`/tables/${editingTable.id}/`, payload);
      } else {
        await api.post('/tables/', payload);
      }

      closeTableModal();
      fetchData();
    } catch (error: any) {
      console.error("Error saving table:", error);
      const message = error?.response?.data?.detail || "Failed to save table. Ensure the number is unique.";
      alert(message);
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.patch(`/tables/sections/${editingSection.id}/`, sectionForm);
      } else {
        await api.post('/tables/sections/', sectionForm);
      }
      closeSectionModal();
      fetchData();
    } catch (error) {
      console.error("Error saving section:", error);
      alert("Failed to save section.");
    }
  };

  const openTableModal = (table: Table | null = null) => {
    if (table) {
      setEditingTable(table);
      setTableForm({
        number: table.number,
        capacity: table.capacity,
        section: table.section?.toString() || '',
      });
    } else {
      setEditingTable(null);
      setTableForm({ number: '', capacity: 4, section: '' });
    }
    setIsTableModalOpen(true);
  };

  const closeTableModal = () => {
    setIsTableModalOpen(false);
    setEditingTable(null);
  };

  const openSectionModal = (section: Section | null = null) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        name: section.name,
        display_order: section.display_order,
      });
    } else {
      setEditingSection(null);
      setSectionForm({ name: '', display_order: sections.length });
    }
    setIsSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setEditingSection(null);
  };

  const handleDeleteTable = async (id: number) => {
    if (!window.confirm("Delete this table?")) return;
    try {
      await api.delete(`/tables/${id}/`);
      fetchData();
    } catch (error) {
      alert("Cannot delete table with active orders.");
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm("Delete this section? Tables in it will be unassigned.")) return;
    try {
      await api.delete(`/tables/sections/${id}/`);
      fetchData();
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Table Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize your restaurant floor and seating capacity.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => activeTab === 'tables' ? openTableModal() : openSectionModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add {activeTab === 'tables' ? 'Table' : 'Section'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('tables')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'tables'
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <Square className="w-4 h-4" />
              Dining Tables
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={cn(
                "w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'sections'
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Floor Sections
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : activeTab === 'tables' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Table No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Section</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {tables.map((table) => (
                    <tr key={table.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        #{table.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {table.section_name || <span className="text-slate-300 italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {table.capacity} Persons
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                          table.status === 'FREE' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          table.status === 'OCCUPIED' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {table.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openTableModal(table)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((sec) => (
                <div key={sec.id} className="group border-2 border-slate-50 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-100 hover:bg-indigo-50/30 transition-all bg-white shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 tracking-tight text-lg">{sec.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Order: {sec.display_order}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openSectionModal(sec)}
                      className="text-slate-300 hover:text-indigo-600 p-2 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="text-slate-300 hover:text-rose-600 p-2 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">{editingTable ? 'Edit' : 'Add'} Dining Table</h3>
              <button onClick={closeTableModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleTableSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Table Number</label>
                  <input
                    required
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={tableForm.number}
                    onChange={e => setTableForm({...tableForm, number: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Capacity</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={tableForm.capacity}
                    onChange={e => setTableForm({...tableForm, capacity: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Assign to Section</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={tableForm.section}
                  onChange={e => setTableForm({...tableForm, section: e.target.value})}
                >
                  <option value="">Select Section...</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg mt-4 transition-all">
                {editingTable ? 'Update Table' : 'Create Table'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">{editingSection ? 'Edit' : 'New'} Floor Section</h3>
              <button onClick={closeSectionModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSectionSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Section Name</label>
                <input
                  required
                  placeholder="e.g. Garden Area"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={sectionForm.name}
                  onChange={e => setSectionForm({...sectionForm, name: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Display Order</label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={sectionForm.display_order}
                    onChange={e => setSectionForm({...sectionForm, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg mt-4 transition-all">
                {editingSection ? 'Update Section' : 'Create Section'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
