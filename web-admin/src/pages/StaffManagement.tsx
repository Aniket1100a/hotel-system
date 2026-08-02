import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { UserPlus, Trash2, Loader2, ShieldCheck, Phone, User as UserIcon, X, Users, CalendarCheck, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import AttendanceSection from '@/components/staff/AttendanceSection';
import PaymentSection from '@/components/staff/PaymentSection';

interface StaffMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'payments'>('list');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'WAITER',
    phone_number: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users/');
      setStaff(res.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/users/', formData);
      setIsMobileOpen(false);
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'WAITER',
        phone_number: '',
      });
      fetchStaff();
    } catch (error) {
      console.error("Error creating staff:", error);
      alert("Failed to create staff member. Check if username exists.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this employee?")) return;
    try {
      await api.delete(`/auth/users/${id}/`);
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-tight">Staff Management</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium italic">
            Monitor attendance, process payments, and manage your restaurant team.
          </p>
        </div>
        {activeTab === 'list' && (
            <div className="mt-4 sm:mt-0">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-2xl shadow-lg shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                    New Employee
                </button>
            </div>
        )}
      </div>

      <div className="bg-white shadow-xl shadow-slate-100/50 rounded-[2.5rem] border-2 border-slate-50 overflow-hidden flex flex-col">
        <div className="border-b-2 border-slate-50 p-2">
          <nav className="flex gap-2" aria-label="Tabs">
            {[
                { id: 'list', label: 'Staff List', icon: Users },
                { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
                { id: 'payments', label: 'Payment Records', icon: Wallet },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                        "flex-1 py-4 px-1 text-center font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 rounded-2xl",
                        activeTab === tab.id
                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
            {activeTab === 'list' && (
                <>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="relative px-6 py-4"><span className="sr-only">Delete</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm border-2 border-white shadow-sm">
                                                    {member.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-800">{member.first_name} {member.last_name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">@{member.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase border-2",
                                                member.role === 'ADMIN' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                member.role === 'MANAGER' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                "bg-slate-50 text-slate-600 border-slate-200"
                                            )}>
                                                <ShieldCheck className="w-3 h-3" />
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                {member.phone_number || 'No Contact'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="text-slate-300 hover:text-rose-600 transition-all p-2 rounded-xl hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </>
            )}

            {activeTab === 'attendance' && <AttendanceSection />}
            {activeTab === 'payments' && <PaymentSection />}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add New Employee</h3>
              <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">First Name</label>
                  <input
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Last Name</label>
                  <input
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Temporary Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Role</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                    <option value="BILLER">Cashier / Biller</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Owner / Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                  <input
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
              >
                Register Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
