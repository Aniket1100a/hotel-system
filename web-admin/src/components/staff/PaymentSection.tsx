import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Banknote, Plus, History, Loader2, Trash2, Calendar, User, Image as ImageIcon, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentSection() {
  const [staff, setStaff] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        alert("Failed to save payment.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      await api.delete(`/staff/payments/${id}/`);
      fetchData();
    } catch (err) {
      console.error("Error deleting payment:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <History className="w-5 h-5 text-indigo-500" />
          Payment History
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="bg-white rounded-3xl border-2 border-slate-50 overflow-hidden shadow-sm">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Screenshot</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                            <th className="relative px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {payments.map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500">{new Date(pay.payment_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-black text-slate-800">{pay.full_name}</div>
                                    <div className="text-[10px] font-bold text-slate-400">@{pay.staff_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                        pay.payment_type === 'SALARY' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                        pay.payment_type === 'ADVANCE' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {pay.payment_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">₹{parseFloat(pay.amount).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {pay.attachment ? (
                                        <a
                                            href={pay.attachment}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-all"
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            VIEW
                                        </a>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">No Attachment</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{pay.notes || '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(pay.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Record Payment</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Transaction</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Employee</label>
                <div className="relative">
                    <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                    <select
                        required
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                        value={formData.user}
                        onChange={e => setFormData({...formData, user: e.target.value})}
                    >
                        <option value="">Select Staff...</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (@{s.username})</option>)}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                    <input
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 outline-none transition-all font-black text-slate-900 text-lg"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Date</label>
                    <input
                        required
                        type="date"
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-600"
                        value={formData.payment_date}
                        onChange={e => setFormData({...formData, payment_date: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Type</label>
                <div className="grid grid-cols-3 gap-3">
                    {['SALARY', 'ADVANCE', 'BONUS'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, payment_type: type})}
                            className={cn(
                                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                formData.payment_type === type
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attach Screenshot (Optional)</label>
                <div className="relative group">
                    <div className={cn(
                        "w-full px-5 py-3 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center gap-3 transition-all",
                        attachment ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300"
                    )}>
                        <Paperclip className={cn("w-5 h-5", attachment ? "text-indigo-600" : "text-slate-400")} />
                        <span className={cn("text-xs font-bold", attachment ? "text-indigo-600" : "text-slate-400")}>
                            {attachment ? attachment.name : "Select photo..."}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                <textarea
                    placeholder="Reference, month name, or other details..."
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 outline-none transition-all font-medium text-slate-600 text-sm h-24 resize-none"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-[1.25rem] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-xs"
              >
                Confirm Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
