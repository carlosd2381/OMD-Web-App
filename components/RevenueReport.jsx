import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient'; // FIX: Corrected the relative import path
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Reusable Components for the Report ---

/**
 * A styled card for displaying a key summary metric.
 */
const SummaryCard = ({ title, value, isLoading }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
    {isLoading ? (
      <div className="h-8 bg-gray-200 rounded-md animate-pulse mt-2"></div>
    ) : (
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    )}
  </div>
);

/**
 * A styled container for filter controls.
 */
const FilterBar = ({ children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
    <div className="flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);

// --- Main Revenue Report Component ---

function RevenueReport() {
  // State for filters, with default date range (last 30 days)
  const [filters, setFilters] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalInvoices: 0, avgInvoiceValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch invoices that are 'Paid' within the selected date range
      let query = supabase
        .from('invoices')
        .select('*, contacts(full_name)')
        .eq('status', 'Paid');

      if (filters.startDate) {
        query = query.gte('issue_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('issue_date', filters.endDate);
      }
      
      const { data, error } = await query.order('issue_date', { ascending: false });

      if (error) throw error;
      
      setReportData(data || []);

      // --- Process data for summary and chart ---
      const totalRevenue = data.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
      const totalInvoices = data.length;
      const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      setSummary({ totalRevenue, totalInvoices, avgInvoiceValue });

      // Aggregate data by date for the chart
      const dailyData = data.reduce((acc, inv) => {
        const date = new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        if (!acc[date]) {
          acc[date] = { date, revenue: 0 };
        }
        acc[date].revenue += inv.total_amount;
        return acc;
      }, {});

      const sortedChartData = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
      setChartData(sortedChartData);

    } catch (err) {
      setError(err.message);
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Effect to re-run the report when filters change
  useEffect(() => {
    generateReport();
  }, [generateReport]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Report</h1>
          <p className="text-lg text-gray-600 mt-1">Analyze revenue from paid invoices within a specific period.</p>
        </div>

        <FilterBar>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="self-end">
             <button onClick={generateReport} disabled={loading} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 disabled:opacity-50 h-full">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </FilterBar>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

        {/* --- Summary Metrics --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} isLoading={loading} />
          <SummaryCard title="Paid Invoices" value={summary.totalInvoices.toLocaleString()} isLoading={loading} />
          <SummaryCard title="Avg. Invoice Value" value={formatCurrency(summary.avgInvoiceValue)} isLoading={loading} />
        </div>

        {/* --- Revenue Chart --- */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
           <h3 className="text-xl font-bold text-gray-800 mb-4">Revenue Over Time</h3>
           {loading ? (
             <div className="h-80 bg-gray-200 rounded-md animate-pulse"></div>
           ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value, 'USD').replace('.00', '')} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#4f46e5" name="Revenue (USD)" />
              </BarChart>
            </ResponsiveContainer>
           )}
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
                  <th className="px-5 py-3">Date Paid</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10">Loading data...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{invoice.invoice_number}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{invoice.contacts?.full_name || 'N/A'}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{new Date(invoice.issue_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{formatCurrency(invoice.total_amount)}</p></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-10 text-gray-500">No paid invoices found for the selected period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default RevenueReport;
