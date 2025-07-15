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

// --- Main Tax Report Component ---

function TaxReport() {
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
  const [summary, setSummary] = useState({ totalTaxable: 0, totalTax: 0 });
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
      // 1. Fetch all paid invoices within the date range
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('event_id') // FIX: Select event_id instead of quote_id
        .eq('status', 'Paid')
        .gte('issue_date', filters.startDate)
        .lte('issue_date', filters.endDate);
      if (invoicesError) throw invoicesError;

      if (!invoices || invoices.length === 0) {
        setReportData([]);
        setSummary({ totalTaxable: 0, totalTax: 0 });
        setLoading(false);
        return;
      }
      const eventIds = [...new Set(invoices.map(inv => inv.event_id).filter(id => id))];

      if (eventIds.length === 0) {
        setReportData([]);
        setSummary({ totalTaxable: 0, totalTax: 0 });
        setLoading(false);
        return;
      }
      
      // 2. Fetch the events to get the quote_ids
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('quote_id')
        .in('id', eventIds);
      if (eventsError) throw eventsError;
      
      const quoteIds = events.map(event => event.quote_id).filter(id => id);

      if (quoteIds.length === 0) {
        setReportData([]);
        setSummary({ totalTaxable: 0, totalTax: 0 });
        setLoading(false);
        return;
      }

      // 3. Fetch all tax rates and create a lookup map
      const { data: allTaxRates, error: ratesError } = await supabase
        .from('tax_rates')
        .select('id, rate_name, rate_percentage');
      if (ratesError) throw ratesError;
      const ratesMap = allTaxRates.reduce((acc, rate) => {
        acc[rate.id] = rate;
        return acc;
      }, {});

      // 4. Fetch the join table for tax groups and rates
      const { data: taxGroupItems, error: joinTableError } = await supabase
        .from('tax_group_items')
        .select('tax_group_id, tax_rate_id');
      if (joinTableError) throw joinTableError;

      const groupToRatesMap = taxGroupItems.reduce((acc, join) => {
        if (!acc[join.tax_group_id]) {
          acc[join.tax_group_id] = [];
        }
        if (ratesMap[join.tax_rate_id]) {
          acc[join.tax_group_id].push(ratesMap[join.tax_rate_id]);
        }
        return acc;
      }, {});

      // 5. Fetch all relevant quote items and their parent quote's tax_rate_id
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('total_price, quotes(tax_rate_id)')
        .in('quote_id', quoteIds);
      if (itemsError) throw itemsError;

      // 6. Process the data to aggregate taxes
      const taxAggregation = {};
      let totalTaxableAmount = 0;

      quoteItems.forEach(item => {
        totalTaxableAmount += item.total_price;
        const taxRateId = item.quotes?.tax_rate_id;
        const rate = ratesMap[taxRateId];

        if (rate) {
           if (!taxAggregation[rate.id]) {
              taxAggregation[rate.id] = {
                name: rate.rate_name,
                rate: rate.rate_percentage,
                taxableAmount: 0,
                taxCollected: 0,
              };
            }
            const taxAmount = item.total_price * (rate.rate_percentage / 100);
            taxAggregation[rate.id].taxableAmount += item.total_price;
            taxAggregation[rate.id].taxCollected += taxAmount;
        }
      });
      
      const processedData = Object.values(taxAggregation);
      setReportData(processedData);

      // 7. Calculate summary totals
      const totalTaxCollected = processedData.reduce((acc, rate) => acc + rate.taxCollected, 0);
      setSummary({ totalTaxable: totalTaxableAmount, totalTax: totalTaxCollected });

    } catch (err) {
      setError(err.message);
      console.error("Error generating tax report:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Tax Report</h1>
          <p className="text-lg text-gray-600 mt-1">Review taxes collected from paid invoices, grouped by tax rate.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SummaryCard title="Total Taxable Revenue" value={formatCurrency(summary.totalTaxable)} isLoading={loading} />
          <SummaryCard title="Total Tax Collected" value={formatCurrency(summary.totalTax)} isLoading={loading} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Tax Breakdown by Rate</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Tax Rate Name</th>
                  <th className="px-5 py-3 text-center">Rate</th>
                  <th className="px-5 py-3 text-right">Taxable Amount</th>
                  <th className="px-5 py-3 text-right">Tax Collected</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10">Loading data...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((tax) => (
                    <tr key={tax.name} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{tax.name}</p></td>
                      <td className="px-5 py-4 text-sm text-center"><p className="text-gray-900">{tax.rate}%</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{formatCurrency(tax.taxableAmount)}</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{formatCurrency(tax.taxCollected)}</p></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-10 text-gray-500">No tax data found for the selected period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxReport;
