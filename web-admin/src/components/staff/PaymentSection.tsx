import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Banknote, Plus, History, Loader2, Trash2, Calendar, User, Image as ImageIcon, Paperclip, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentSection() {
  const [staff, setStaff] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    user: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'SALARY',
    notes: ''
  });
  const [attachment, setAttachment] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, payRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get('/staff/payments/')
      ]);
      setStaff(staffRes.data);
      setPayments(payRes.data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('user', formData.user);
      data.append('amount', formData.amount);
      data.append('payment_date', formData.payment_date);
      data.append('payment_type', formData.payment_type);
      data.append('notes', formData.notes);
      if (attachment) {
        data.append('attachment', attachment);
      }

      await api.post('/staff/payments/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsModalOpen(false);
      setFormData({
        user: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'SALARY',
        notes: ''
      });
      setAttachment(null);
      fetchData();
    } catch (err) {
        console.error("Error saving payment:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this financial record?")) return;
    try {
      await api.delete(`/staff/payments/${id}/`);
      fetchData();
    } catch (err) {
      console.error("Error deleting payment:", err);
    }
  };

  const filteredPayments = payments.filter(pay =>
    pay.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pay.staff_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Record New Entry
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Compiling Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaction Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beneficiary</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entry Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Amount</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-800">
                          {new Date(pay.payment_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ID: TXN-{pay.id.toString().padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-500 border border-slate-200">
                          {pay.staff_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{pay.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">@{pay.staff_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                        pay.payment_type === 'SALARY' ? "bg-primary-50 text-primary-700 border-primary-100" :
                        pay.payment_type === 'ADVANCE' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                        {pay.payment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-slate-900 tracking-tight">₹{parseFloat(pay.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pay.attachment ? (
                        <a
                          href={pay.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 hover:bg-primary-100 transition-all"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          VIEW
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">No Reference</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(pay.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                       <Banknote className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                       <h3 className="text-slate-800 font-bold">No transactions found</h3>
                       <p className="text-slate-400 text-sm font-medium mt-1">Start recording payroll and advances.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-[16px]">Financial Record Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Staff Beneficiary</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium outline-none appearance-none"
                    value={formData.user}
                    onChange={e => setFormData({...formData, user: e.target.value})}
                  >
                    <option value="">Select Employee...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Net Amount (₹)</label>
                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Process Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium outline-none"
                      value={formData.payment_date}
                      onChange={e => setFormData({...formData, payment_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Transaction Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['SALARY', 'ADVANCE', 'BONUS'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, payment_type: type})}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                          formData.payment_type === type
                            ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:border-primary-300"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Transaction Proof (Optional)</label>
                  <div className="relative">
                    <div className={cn(
                      "w-full px-4 py-3 bg-slate-50 border-2 border-dashed rounded-xl flex items-center gap-3 transition-all",
                      attachment ? "border-primary-500 bg-primary-50/30" : "border-slate-200 hover:border-primary-300"
                    )}>
                      <Paperclip className={cn("w-4 h-4", attachment ? "text-primary-600" : "text-slate-400")} />
                      <span className="text-[12px] font-bold text-slate-600 truncate">{attachment ? attachment.name : "Attach receipt..."}</span>
                      <input type="file" accept="image/*" onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
