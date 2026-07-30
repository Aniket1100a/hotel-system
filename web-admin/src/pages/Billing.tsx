import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Receipt, Search, Loader2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { printDirectly } from '@/lib/printUtils';

export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
        payment_method: invoice.payment_method, // Pass the recorded method
        waiter_name: res.data.waiter_name,
        order_type: res.data.order_type
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert("Failed to print bill.");
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!window.confirm("Mark this invoice as Paid? This will also free the table.")) return;
    setUpdatingId(id);
    try {
      await api.post(`/billing/${id}/mark_paid/`);
      fetchInvoices();
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Billing & Invoices</h2>
          <p className="mt-1 text-sm text-slate-500">
            View all generated invoices and their payment status.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 border-slate-200 rounded-lg py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border bg-white shadow-sm"
              placeholder="Search by ID or Table..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
             </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order / Table</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{inv.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Table {inv.table_number} / Order #{inv.order}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => !inv.is_paid && handleMarkPaid(inv.id)}
                          disabled={updatingId === inv.id}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all active:scale-95 disabled:opacity-50",
                            inv.is_paid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer"
                          )}
                        >
                          {updatingId === inv.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                          ) : (
                            inv.is_paid ? 'PAID' : 'PENDING'
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handlePrintInvoice(inv)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"
                          title="Print Bill"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Receipt className="mx-auto h-12 w-12 text-slate-300" />
                      <h3 className="mt-2 text-sm font-medium text-slate-900">No invoices</h3>
                      <p className="mt-1 text-sm text-slate-500">Generate a bill from the Dashboard to see it here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
