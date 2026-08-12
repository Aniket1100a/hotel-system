import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { BarChart3, Calendar, TrendingUp, Wallet, Loader2, ArrowUpRight, ArrowDownRight, ChevronRight, PieChart, X, Receipt, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueData {
  daily: Array<{ date: string; total: string }>;
  monthly: Array<{ month: string; total: string }>;
  this_month_total: number;
}

interface InvoiceDetail {
  id: number;
  table_number: string | null;
  waiter_name: string;
  payment_method: string;
  total_amount: string;
  created_at: string;
  order_type: 'DINE_IN' | 'TAKEAWAY';
}

export default function Reports() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  // Drill-down states
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyInvoices, setDailyInvoices] = useState<InvoiceDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/revenue_stats/');
      setData(res.data);
    } catch (err) {
      console.error("Error fetching revenue stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyDetails = async (date: string) => {
    setSelectedDate(date);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/billing/?date=${date}`);
      setDailyInvoices(res.data);
    } catch (err) {
      console.error("Error fetching daily details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  // Group daily sales by month for the hierarchical view
  const groupedHistory = React.useMemo(() => {
    if (!data) return {};
    return data.daily.reduce((acc: any, day) => {
      const monthKey = day.date.substring(0, 7); // "YYYY-MM"
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(day);
      return acc;
    }, {});
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Financial Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Revenue Analytics</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium italic">
            Confidential financial reports for Owner & Manager access.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={fetchStats}
            className="px-6 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">This Month's Revenue</p>
            <p className="text-4xl font-black tracking-tighter mt-2">₹{Math.round(data?.this_month_total).toLocaleString()}</p>
            <div className="mt-4 flex items-center gap-2">
                <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-black">+12.5%</span>
                <span className="text-[10px] font-bold opacity-60">vs last month</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daily Average</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter mt-2">
            ₹{data && data.daily.length > 0 ? Math.round(data.this_month_total / new Date().getDate()).toLocaleString() : '0'}
          </p>
          <p className="mt-2 text-[10px] font-bold text-slate-400">Based on current month sales</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Transactions</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter mt-2">{data?.daily.length || 0} active days</p>
          <p className="mt-2 text-[10px] font-bold text-slate-400">Recorded for this period</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 overflow-hidden shadow-sm">
        <div className="border-b-2 border-slate-50 p-2">
            <nav className="flex gap-2">
                {[
                    { id: 'daily', label: 'Current Month', icon: Calendar },
                    { id: 'monthly', label: 'Annual History', icon: PieChart },
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
            {activeTab === 'daily' ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data?.daily
                                .filter(item => item.date.startsWith(new Date().toISOString().substring(0, 7)))
                                .map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">
                                                {new Date(item.date).getDate()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">
                                                    {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.date).toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Settled</span>
                                    </td>
                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                        <span className="text-sm font-black text-slate-900 tracking-tight">₹{Math.round(parseFloat(item.total)).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                          onClick={() => fetchDailyDetails(item.date)}
                                          className="p-2 text-slate-300 group-hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-xl"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedHistory).map(([monthKey, days]: any) => {
                        const isExpanded = expandedMonths.has(monthKey);
                        const monthTotal = days.reduce((sum: number, day: any) => sum + parseFloat(day.total), 0);
                        const dateObj = new Date(monthKey + "-01");

                        return (
                            <div key={monthKey} className="border-2 border-slate-50 rounded-[2rem] overflow-hidden transition-all hover:border-indigo-100">
                                <button
                                    onClick={() => toggleMonth(monthKey)}
                                    className="w-full p-6 bg-slate-50/30 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <PieChart className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-lg font-black text-slate-800 capitalize">
                                                {dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {days.length} Active Billing Days
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xl font-black text-indigo-600 tracking-tight">₹{Math.round(monthTotal).toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Monthly Settlement</p>
                                        </div>
                                        <ChevronDown className={cn("w-5 h-5 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180")} />
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="p-4 bg-white border-t border-slate-50 divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {days.map((day: any) => (
                                            <div key={day.date} className="p-4 flex items-center justify-between hover:bg-slate-50/50 rounded-2xl transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs">
                                                        {new Date(day.date).getDate()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-sm font-black text-slate-700">₹{Math.round(parseFloat(day.total)).toLocaleString()}</span>
                                                    <button
                                                        onClick={() => fetchDailyDetails(day.date)}
                                                        className="p-2 text-slate-300 group-hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {Object.keys(groupedHistory).length === 0 && (
                        <div className="py-20 text-center">
                            <BarChart3 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No monthly data available yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Daily Breakdown Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Revenue Breakdown</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Bills...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyInvoices.map((inv) => (
                    <div key={inv.id} className="p-5 bg-slate-50 rounded-3xl border-2 border-white shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-black text-slate-800">Bill #{inv.id}</p>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">•</span>
                             <span className={cn(
                               "text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                               inv.order_type === 'TAKEAWAY' ? "text-slate-500" : "text-indigo-600"
                             )}>
                               {inv.order_type === 'TAKEAWAY' ? <ShoppingBag className="w-3 h-3" /> : null}
                               {inv.order_type === 'TAKEAWAY' ? 'Takeaway' : `Table ${inv.table_number}`}
                             </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {inv.waiter_name}</span>
                            <span>•</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-100 text-slate-500">{inv.payment_method}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900 tracking-tighter">₹{Math.round(parseFloat(inv.total_amount)).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-emerald-500 uppercase">Paid</p>
                      </div>
                    </div>
                  ))}
                  {dailyInvoices.length === 0 && (
                    <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found for this date.</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Daily Settlement</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">
                    ₹{Math.round(dailyInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)).toLocaleString()}
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
