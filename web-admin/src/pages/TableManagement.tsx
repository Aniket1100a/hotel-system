import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Plus, Edit2, Trash2, Loader2, X, LayoutGrid, Square, Users, ArrowUpDown, Search, Map as MapIcon } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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
      console.error("Delete failed:", error);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm("Delete this floor section?")) return;
    try {
      await api.delete(`/tables/sections/${id}/`);
      fetchData();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filteredTables = tables.filter(t =>
    t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.section_name && t.section_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Floor & Seating</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Configure restaurant sections and individual table capacities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeTab === 'tables' ? openTableModal() : openSectionModal()}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'tables' ? 'New Table' : 'Section'}
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center p-1 bg-slate-50 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('tables')}
            className={cn(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'tables' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Square className="w-4 h-4" />
            Dining Tables
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={cn(
              "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'sections' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Floor Sections
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search floor map..."
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
            <p className="text-slate-400 text-sm font-medium">Synchronizing floor plan...</p>
          </div>
        ) : activeTab === 'tables' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identity</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Floor Section</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
                    <tr key={table.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border",
                            table.status === 'FREE' ? "bg-white text-slate-400 border-slate-200" : "bg-primary-600 text-white border-primary-600"
                          )}>
                            {table.number}
                          </div>
                          <span className="text-[14px] font-bold text-slate-800">Table {table.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {table.section_name || 'Global Floor'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[13px]">
                          <Users className="w-3.5 h-3.5" />
                          {table.capacity} Persons
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          table.status === 'FREE' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          table.status === 'OCCUPIED' ? "bg-primary-50 text-primary-700 border-primary-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {table.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openTableModal(table)}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTable(table.id)}
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
                        <Square className="w-12 h-12 text-slate-100 mb-4" />
                        <h3 className="text-slate-800 font-bold">No tables defined</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Start by adding your first dining table.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sections.map((sec) => (
              <div key={sec.id} className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-primary-200 hover:shadow-lg transition-all flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                   <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                      <MapIcon className="w-6 h-6" />
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openSectionModal(sec)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteSection(sec.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <div>
                   <h4 className="font-bold text-slate-900 text-lg leading-tight">{sec.name}</h4>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     Display Index: {sec.display_order}
                   </p>
                </div>
              </div>
            ))}
            {sections.length === 0 && (
               <div className="col-span-full py-20 text-center">
                  <LayoutGrid className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm font-medium">No floor sections created yet.</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">{editingTable ? 'Edit Table Settings' : 'Create New Table'}</h3>
              <button onClick={closeTableModal} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleTableSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Table ID / Number</label>
                  <input
                    required
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={tableForm.number}
                    onChange={e => setTableForm({...tableForm, number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Max Seating</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={tableForm.capacity}
                      onChange={e => setTableForm({...tableForm, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Assign Section</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none appearance-none"
                  value={tableForm.section}
                  onChange={e => setTableForm({...tableForm, section: e.target.value})}
                >
                  <option value="">Select Floor Section...</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeTableModal}
                  className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                >
                  {editingTable ? 'Save Changes' : 'Publish Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">{editingSection ? 'Edit Section' : 'Add New Section'}</h3>
              <button onClick={closeSectionModal} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSectionSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Section Label</label>
                  <input
                    required
                    placeholder="e.g. Roof Top"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={sectionForm.name}
                    onChange={e => setSectionForm({...sectionForm, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sort Priority</label>
                  <div className="relative">
                    <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={sectionForm.display_order}
                      onChange={e => setSectionForm({...sectionForm, display_order: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
              >
                {editingSection ? 'Update Section' : 'Create Section'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
