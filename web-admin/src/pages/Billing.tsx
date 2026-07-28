import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/axios';
import { Receipt, Search, Eye, Loader2, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceItem {
  menu_item_name: string;
  quantity: number;
  price_at_order: string;
  subtotal: string;
}

interface InvoiceDetail {
  id: number;
  order_id: number;
  table_number: string;
  billed_by_name: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  created_at: string;
  items?: InvoiceItem[];
}

export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  const handleViewInvoice = async (invoice: any) => {
    try {
      const res = await api.get(`/orders/${invoice.order}/`);
      setSelectedInvoice({
        ...invoice,
        order_id: invoice.order,
        items: res.data.items
      });
      setShowPrintModal(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
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

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Bill</title>
            <style>
              @page { margin: 0; }
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 80mm;
                margin: 0;
                padding: 5mm;
                font-size: 12px;
                line-height: 1.2;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              .text-right { text-align: right; }
              .footer { margin-top: 10px; font-size: 10px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
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
                          onClick={() => handleViewInvoice(inv)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"
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

      {/* Print Modal */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Bill Preview</h3>
              <button onClick={() => setShowPrintModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="bg-white p-6 shadow-sm border border-slate-200 mx-auto" style={{ width: '80mm' }} ref={printRef}>
                <div className="center">
                  <p className="bold" style={{ fontSize: '16px', margin: '0' }}>HOTEL CHATURTHI</p>
                  <p className="bold" style={{ fontSize: '12px', margin: '0' }}>PURE VEG RESTAURANT</p>
                  <p style={{ fontSize: '10px' }}>Dhule-Solapur Highway, Vashi</p>
                  <p className="divider"></p>
                  <p className="bold">TAX INVOICE</p>
                </div>

                <div style={{ fontSize: '11px', margin: '10px 0' }}>
                  <p style={{ margin: '2px 0' }}>INV: #{selectedInvoice.id} | TBL: {selectedInvoice.table_number}</p>
                  <p style={{ margin: '2px 0' }}>DATE: {new Date(selectedInvoice.created_at).toLocaleString()}</p>
                  <p style={{ margin: '2px 0' }}>CASHIER: {selectedInvoice.billed_by_name}</p>
                </div>

                <p className="divider"></p>

                <table>
                  <thead>
                    <tr className="bold">
                      <td style={{ width: '60%' }}>ITEM</td>
                      <td className="text-right">QTY</td>
                      <td className="text-right">AMT</td>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.menu_item_name}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="divider"></p>

                <table>
                  <tbody>
                    <tr>
                      <td className="bold">SUBTOTAL</td>
                      <td className="text-right bold">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>CGST (2.5%)</td>
                      <td className="text-right">₹{(parseFloat(selectedInvoice.tax_amount)/2).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>SGST (2.5%)</td>
                      <td className="text-right">₹{(parseFloat(selectedInvoice.tax_amount)/2).toFixed(2)}</td>
                    </tr>
                    {parseFloat(selectedInvoice.discount_amount) > 0 && (
                      <tr className="text-rose-600">
                        <td>DISCOUNT</td>
                        <td className="text-right">-₹{parseFloat(selectedInvoice.discount_amount).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bold" style={{ fontSize: '14px' }}>
                      <td>TOTAL</td>
                      <td className="text-right">₹{parseFloat(selectedInvoice.total_amount).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="divider"></p>

                <div className="center footer">
                  <p className="bold">THANK YOU! VISIT AGAIN</p>
                  <p>Developed by Vinay</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                <Printer className="w-5 h-5" />
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
