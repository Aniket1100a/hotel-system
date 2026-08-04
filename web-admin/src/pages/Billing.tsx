import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Receipt, Search, Loader2, Printer, Filter, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { printDirectly } from '@/lib/printUtils';

export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/');
      setInvoices(res.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePrintInvoice = async (invoice: any) => {
    try {
      const res = await api.get(`/orders/${invoice.order}/`);
      printDirectly({
        ...invoice,
        items: res.data.items,
        payment_method: invoice.payment_method,
        waiter_name: res.data.waiter_name,
        order_type: res.data.order_type
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!window.confirm("Mark this invoice as Settled?")) return;
    setUpdatingId(id);
    try {
      await api.post(`/billing/${id}/mark_paid/`);
      fetchInvoices();
    } catch (error) {
      console.error("Error marking as paid:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    (inv.bill_no && inv.bill_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    inv.id.toString().includes(searchQuery) ||
    (inv.table_number && inv.table_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Records</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Audit logs and settlement records for all generated invoices.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice ID or Table Number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
           <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              Filter
           </button>
           <button className="flex-1 sm:flex-none px-4 py-2.5 bg-primary-600 text-white rounded-xl text-[13px] font-bold hover:bg-primary-700 transition-all shadow-sm shadow-primary-200">
              Export CSV
           </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Retrieving financial logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice / Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settlement</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[14px] font-bold text-slate-800">{inv.bill_no || `INV-#${inv.id.toString().padStart(6, '0')}`}</p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {new Date(inv.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {inv.table_number ? `Table ${inv.table_number}` : 'Takeaway'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-400">Ord #{inv.order}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-bold text-slate-900 tracking-tight">₹{parseFloat(inv.total_amount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm">
                          {inv.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => !inv.is_paid && handleMarkPaid(inv.id)}
                          disabled={updatingId === inv.id}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all",
                            inv.is_paid
                              ? "bg-emerald-50 text-emerald-700 cursor-default"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm border border-amber-200"
                          )}
                        >
                          {updatingId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : inv.is_paid ? (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> SETTLED</>
                          ) : (
                            <><Clock className="w-3.5 h-3.5" /> PENDING</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handlePrintInvoice(inv)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Print Receipt"
                        >
                          <Printer className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Receipt className="w-12 h-12 text-slate-100 mb-4" />
                        <h3 className="text-slate-800 font-bold">No records found</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Try adjusting your filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
