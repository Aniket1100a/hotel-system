import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { CheckCircle2, XCircle, Clock, Calendar, Loader2, Save, Paperclip, Image as ImageIcon, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendanceSection() {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, attRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get(`/staff/attendance/?date=${selectedDate}`)
      ]);
      setStaff(staffRes.data);
      setAttendance(attRes.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const toggleAttendance = async (userId: number, currentStatus: string, file?: File) => {
    const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    const record = attendance.find(a => a.user === userId);

    setSaving(userId);
    try {
      const data = new FormData();
      data.append('status', nextStatus);
      if (file) data.append('attachment', file);

      if (record) {
        await api.patch(`/staff/attendance/${record.id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        data.append('user', userId.toString());
        data.append('date', selectedDate);
        await api.post('/staff/attendance/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchData();
    } catch (err) {
      console.error("Error updating attendance:", err);
    } finally {
      setSaving(null);
    }
  };

  const uploadProof = async (userId: number, file: File) => {
    const record = attendance.find(a => a.user === userId);
    setSaving(userId);
    try {
        const data = new FormData();
        data.append('attachment', file);
        if (!record) {
            data.append('user', userId.toString());
            data.append('date', selectedDate);
            data.append('status', 'ABSENT');
            await api.post('/staff/attendance/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            await api.patch(`/staff/attendance/${record.id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        fetchData();
    } catch (err) {
        console.error("Error uploading proof:", err);
    } finally {
        setSaving(null);
    }
  };

  const updateTime = async (userId: number, field: 'check_in' | 'check_out', value: string) => {
    const record = attendance.find(a => a.user === userId);
    if (!record) return;
    try {
        await api.patch(`/staff/attendance/${record.id}/`, { [field]: value });
        fetchData();
    } catch (err) {
        console.error("Error updating time:", err);
    }
  };

  const filteredStaff = staff.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Date and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <Calendar className="w-4 h-4 text-primary-600" />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
          />
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance Status</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duty Schedule</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaff.map(member => {
                  const record = attendance.find(a => a.user === member.id);
                  const isPresent = record?.status === 'PRESENT';

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[13px] font-bold text-slate-500 border border-slate-200">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-800 leading-tight">{member.first_name} {member.last_name}</p>
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => toggleAttendance(member.id, record?.status || 'ABSENT')}
                          disabled={saving === member.id}
                          className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all border shadow-sm",
                            isPresent
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          )}
                        >
                          {saving === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />)}
                          {isPresent ? 'PRESENT' : 'ABSENT'}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">In</span>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <input
                                type="time"
                                disabled={!isPresent}
                                value={record?.check_in || ''}
                                onChange={(e) => updateTime(member.id, 'check_in', e.target.value)}
                                className="bg-transparent border-none text-[12px] font-bold text-slate-600 outline-none disabled:opacity-30 w-16"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">Out</span>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <input
                                type="time"
                                disabled={!isPresent}
                                value={record?.check_out || ''}
                                onChange={(e) => updateTime(member.id, 'check_out', e.target.value)}
                                className="bg-transparent border-none text-[12px] font-bold text-slate-600 outline-none disabled:opacity-30 w-16"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative">
                            <label className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed cursor-pointer transition-all",
                                record?.attachment
                                  ? "bg-primary-50 border-primary-300 text-primary-700 shadow-sm"
                                  : "border-slate-200 text-slate-400 hover:border-primary-300 hover:bg-primary-50/30"
                            )}>
                                <Paperclip className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold uppercase">{record?.attachment ? 'Attached' : 'Add Proof'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadProof(member.id, file);
                                    }}
                                />
                            </label>
                            {record?.attachment && (
                                <a
                                    href={record.attachment}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute -top-2 -right-2 bg-white shadow-md border border-slate-100 rounded-full p-1 text-primary-600 hover:scale-110 transition-transform"
                                    title="View Proof"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
