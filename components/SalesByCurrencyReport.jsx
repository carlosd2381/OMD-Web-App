import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Reusable Components for the Report ---

const SummaryCard = ({ title, value, isLoading, currencyColor }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <div className="flex justify-between items-center">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
      <span className={`w-4 h-4 rounded-full ${currencyColor}`}></span>
    </div>
    {isLoading ? (
      <div className="h-8 bg-gray-200 rounded-md animate-pulse mt-2"></div>
    ) : (
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    )}
  </div>
);

const FilterBar = ({ children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
    <div className="flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);

// --- Main Sales by Currency Report Component ---

function SalesByCurrencyReport() {
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
  const [summary, setSummary] = useState({ totalUSD: 0, totalMXN: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount, currency) => 
    new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', { style: 'currency', currency }).format(amount);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('invoices')
        .select('*, contacts(full_name)')
        .eq('status', 'Paid');

      if (filters.startDate) query = query.gte('issue_date', filters.startDate);
      if (filters.endDate) query = query.lte('issue_date', filters.endDate);
      
      const { data, error } = await query.order('issue_date', { ascending: false });

      if (error) throw error;
      
      setReportData(data || []);

      // Process data for summary and chart
      const totals = data.reduce((acc, inv) => {
        if (inv.currency === 'USD') {
          acc.totalUSD += inv.total_amount;
        } else if (inv.currency === 'MXN') {
          acc.totalMXN += inv.total_amount;
        }
        return acc;
      }, { totalUSD: 0, totalMXN: 0 });

      setSummary(totals);

      setChartData([
        { name: 'USD', value: totals.totalUSD },
        { name: 'MXN', value: totals.totalMXN },
      ]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const COLORS = ['#10b981', '#3b82f6']; // Green for USD, Blue for MXN

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Sales by Currency Report</h1>
          <p className="text-lg text-gray-600 mt-1">Analyze the breakdown of revenue by currency.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* --- Summary Cards --- */}
          <div className="lg:col-span-1 space-y-8">
            <SummaryCard title="Total Revenue (USD)" value={formatCurrency(summary.totalUSD, 'USD')} isLoading={loading} currencyColor="bg-green-500" />
            <SummaryCard title="Total Revenue (MXN)" value={formatCurrency(summary.totalMXN, 'MXN')} isLoading={loading} currencyColor="bg-blue-500" />
          </div>

          {/* --- Currency Split Chart --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Currency Split</h3>
             {loading ? (
               <div className="h-80 bg-gray-200 rounded-md animate-pulse"></div>
             ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [formatCurrency(value, name), name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
             )}
          </div>
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
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{formatCurrency(invoice.total_amount, invoice.currency)}</p></td>
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

export default SalesByCurrencyReport;
