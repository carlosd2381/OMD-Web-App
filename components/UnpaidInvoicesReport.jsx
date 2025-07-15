import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

// --- Reusable Components for the Report ---

const SummaryCard = ({ title, value, isLoading }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
    {isLoading ? (
      <div className="h-8 bg-gray-200 rounded-md animate-pulse mt-2"></div>
    ) : (
      <p className="text-3xl font-bold text-red-600 mt-1">{value}</p>
    )}
  </div>
);

// --- Main Unpaid Invoices Report Component ---

function UnpaidInvoicesReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ totalOutstanding: 0, totalInvoices: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const calculateDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    // Set hours to 0 to compare dates only
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (due >= today) return 0;
    
    const differenceInTime = today.getTime() - due.getTime();
    return Math.ceil(differenceInTime / (1000 * 3600 * 24));
  };
  
  const fetchUnpaidInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contacts(full_name)')
        .not('status', 'eq', 'Paid')
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      const processedData = data.map(invoice => ({
        ...invoice,
        days_overdue: calculateDaysOverdue(invoice.due_date),
        balance_due: invoice.total_amount - invoice.amount_paid
      }));

      setReportData(processedData || []);

      const totalOutstanding = processedData.reduce((acc, inv) => acc + inv.balance_due, 0);
      const totalInvoices = processedData.length;

      setSummary({ totalOutstanding, totalInvoices });

    } catch (err) {
      setError(err.message);
      console.error("Error fetching unpaid invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnpaidInvoices();
  }, [fetchUnpaidInvoices]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Unpaid Invoices Report</h1>
          <p className="text-lg text-gray-600 mt-1">Track all invoices that are not yet fully paid.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

        {/* --- Summary Metrics --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SummaryCard title="Total Outstanding" value={formatCurrency(summary.totalOutstanding)} isLoading={loading} />
          <SummaryCard title="Unpaid Invoices" value={summary.totalInvoices.toLocaleString()} isLoading={loading} />
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Invoice Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-center">Days Overdue</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10">Loading data...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((invoice) => (
                    <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.days_overdue > 0 ? 'bg-red-50' : ''}`}>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{invoice.invoice_number}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{invoice.contacts?.full_name || 'N/A'}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                      <td className="px-5 py-4 text-sm text-center"><p className={`font-semibold ${invoice.days_overdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>{invoice.days_overdue}</p></td>
                       <td className="px-5 py-4 text-sm"><span className="relative inline-block px-3 py-1 font-semibold leading-tight text-yellow-900"><span aria-hidden className="absolute inset-0 bg-yellow-200 opacity-50 rounded-full"></span><span className="relative">{invoice.status}</span></span></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{formatCurrency(invoice.balance_due)}</p></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-500">No unpaid invoices found. Great job!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnpaidInvoicesReport;
