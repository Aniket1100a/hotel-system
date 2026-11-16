import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { CheckCircle2, XCircle, Clock, Calendar, Loader2, Save, Paperclip, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendanceSection() {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState<number | null>(null);

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
    if (!record) {
        alert("Mark presence first!");
        return;
    }

    try {
        await api.patch(`/staff/attendance/${record.id}/`, { [field]: value });
        fetchData();
    } catch (err) {
        console.error("Error updating time:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-slate-700">Attendance for Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {staff.length} Employees Total
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Check In</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map(member => {
                  const record = attendance.find(a => a.user === member.id);
                  const isPresent = record?.status === 'PRESENT';

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                                {member.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{member.first_name} {member.last_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{member.role}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button
                            onClick={() => toggleAttendance(member.id, record?.status || 'ABSENT')}
                            disabled={saving === member.id}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95",
                                isPresent ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                            )}
                            >
                            {saving === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isPresent ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />)}
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                            </button>

                            <div className="relative group/upload">
                                <label className={cn(
                                    "p-2 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center transition-all",
                                    record?.attachment ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-slate-100 text-slate-300 hover:border-slate-200"
                                )}>
                                    <Paperclip className="w-3.5 h-3.5" />
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
                                        className="absolute -top-1 -right-1 bg-white shadow-md rounded-full p-0.5 text-indigo-600 hover:scale-110 transition-transform"
                                    >
                                        <ImageIcon className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <Clock className="w-3 h-3 text-slate-300" />
                           <input
                             type="time"
                             disabled={!isPresent}
                             value={record?.check_in || ''}
                             onChange={(e) => updateTime(member.id, 'check_in', e.target.value)}
                             className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none disabled:opacity-30"
                           />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <Clock className="w-3 h-3 text-slate-300" />
                           <input
                             type="time"
                             disabled={!isPresent}
                             value={record?.check_out || ''}
                             onChange={(e) => updateTime(member.id, 'check_out', e.target.value)}
                             className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none disabled:opacity-30"
                           />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
