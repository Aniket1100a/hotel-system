import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { UserPlus, Edit2, Trash2, Loader2, ShieldCheck, Phone, User as UserIcon, X, Users, CalendarCheck, Wallet, Search, MoreVertical, Mail } from 'lucide-react';
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
  profile?: {
    address: string;
    joining_date: string;
    basic_salary: string;
    is_active: boolean;
    id_proof_number?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    overtime_rate_per_hour?: string;
  };
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'payments'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ onDuty: 0, totalStaff: 0 });

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'WAITER',
    phone_number: '',
    address: '',
    joining_date: new Date().toISOString().split('T')[0],
    basic_salary: '',
    id_proof_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    overtime_rate_per_hour: '0',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const [staffRes, attRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get(`/staff/attendance/?date=${new Date().toISOString().split('T')[0]}`)
      ]);
      setStaff(staffRes.data);
      const onDutyCount = attRes.data.filter((a: any) => a.status === 'PRESENT').length;
      setStats({
        onDuty: onDutyCount,
        totalStaff: staffRes.data.length
      });
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
      const payload = {
        ...formData,
        profile: {
          address: formData.address,
          joining_date: formData.joining_date,
          basic_salary: formData.basic_salary || '0',
          id_proof_number: formData.id_proof_number,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          overtime_rate_per_hour: formData.overtime_rate_per_hour || '0'
        }
      };

      if (editingMember) {
        if (!payload.password) delete (payload as any).password;
        await api.patch(`/auth/users/${editingMember.id}/`, payload);
      } else {
        await api.post('/auth/users/', payload);
      }

      setIsModalOpen(false);
      setEditingMember(null);
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'WAITER',
        phone_number: '',
        address: '',
        joining_date: new Date().toISOString().split('T')[0],
        basic_salary: '',
        id_proof_number: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        overtime_rate_per_hour: '0',
      });
      fetchStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
    }
  };

  const openEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setFormData({
      username: member.username,
      password: '', // Leave empty for security during edit
      first_name: member.first_name,
      last_name: member.last_name,
      role: member.role,
      phone_number: member.phone_number,
      address: member.profile?.address || '',
      joining_date: member.profile?.joining_date || new Date().toISOString().split('T')[0],
      basic_salary: member.profile?.basic_salary || '',
      id_proof_number: member.profile?.id_proof_number || '',
      bank_name: member.profile?.bank_name || '',
      account_number: member.profile?.account_number || '',
      ifsc_code: member.profile?.ifsc_code || '',
      emergency_contact_name: member.profile?.emergency_contact_name || '',
      emergency_contact_phone: member.profile?.emergency_contact_phone || '',
      overtime_rate_per_hour: member.profile?.overtime_rate_per_hour || '0',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Confirm deletion of this staff record?")) return;
    try {
      await api.delete(`/auth/users/${id}/`);
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };

  const filteredStaff = staff.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Manage your organization's workforce, permissions, and payroll.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Staff</p>
              <p className="text-lg font-black text-emerald-600">{stats.onDuty} / {stats.totalStaff}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Load</p>
              <p className="text-lg font-black text-primary-600">{Math.round((stats.onDuty / (stats.totalStaff || 1)) * 100)}%</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-700 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center p-1 bg-slate-50 rounded-xl w-full sm:w-auto">
          {[
            { id: 'list', label: 'Directory', icon: Users },
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
            { id: 'payments', label: 'Payroll & Advances', icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === tab.id ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search directory..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'list' ? (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium">Loading directory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role & Permissions</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200 shadow-sm">
                                {member.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-slate-800">{member.first_name} {member.last_name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">@{member.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border",
                              member.role === 'ADMIN' ? "bg-purple-50 text-purple-700 border-purple-100" :
                              member.role === 'MANAGER' ? "bg-blue-50 text-blue-700 border-blue-100" :
                              "bg-slate-50 text-slate-600 border-slate-200"
                            )}>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                                  <Phone className="w-3.5 h-3.5 text-slate-300" />
                                  {member.phone_number || 'N/A'}
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                                <span className="text-[12px] font-semibold text-slate-500">Active</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button
                                 onClick={() => openEditModal(member)}
                                 className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                 title="Edit Profile"
                               >
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => handleDelete(member.id)}
                                 className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                 title="Delete Record"
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
                            <Users className="w-12 h-12 text-slate-100 mb-4" />
                            <h3 className="text-slate-800 font-bold">No employees found</h3>
                            <p className="text-slate-400 text-sm font-medium mt-1">Adjust your search or add a new team member.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 min-h-[400px]">
            {activeTab === 'attendance' && <AttendanceSection />}
            {activeTab === 'payments' && <PaymentSection />}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">
                {editingMember ? `Update ${editingMember.username}` : 'Onboard New Employee'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingMember(null); }} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                  <input
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                  <input
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                  <input
                    required
                    disabled={!!editingMember}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all disabled:opacity-50"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Joining Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={formData.joining_date}
                    onChange={e => setFormData({...formData, joining_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Home Address</label>
                <textarea
                  placeholder="Street, City, Pin Code"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">System Role</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                    <option value="BILLER">Cashier / Biller</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Overtime Rate (₹/hr)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={formData.overtime_rate_per_hour}
                    onChange={e => setFormData({...formData, overtime_rate_per_hour: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Bank & Identity (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">ID Proof (Aadhar/PAN)</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.id_proof_number}
                      onChange={e => setFormData({...formData, id_proof_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bank Name</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.bank_name}
                      onChange={e => setFormData({...formData, bank_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Account Number</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.account_number}
                      onChange={e => setFormData({...formData, account_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">IFSC Code</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.ifsc_code}
                      onChange={e => setFormData({...formData, ifsc_code: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Emergency Contact (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contact Name</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.emergency_contact_name}
                      onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contact Phone</label>
                    <input
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.emergency_contact_phone}
                      onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Contact</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    {editingMember ? 'New Password' : 'Access Password'}
                  </label>
                  <input
                    required={!editingMember}
                    type="password"
                    placeholder={editingMember ? "Leave blank to keep" : "****"}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingMember(null); }}
                  className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                >
                  {editingMember ? 'Save Changes' : 'Finalize Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
