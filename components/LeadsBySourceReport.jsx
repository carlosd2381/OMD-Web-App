import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Reusable Components for the Report ---

const FilterBar = ({ children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
    <div className="flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);

// --- Main Leads by Source Report Component ---

function LeadsBySourceReport() {
  const [filters, setFilters] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6); // Default to last 6 months
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('contacts')
        .select('lead_source')
        .not('lead_source', 'is', null); // Only include contacts with a lead source

      if (filters.startDate) query = query.gte('inquiry_date', filters.startDate);
      if (filters.endDate) query = query.lte('inquiry_date', filters.endDate);
      
      const { data, error } = await query;

      if (error) throw error;
      
      // Process data for chart
      const sourceCounts = data.reduce((acc, contact) => {
        const source = contact.lead_source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const processedChartData = Object.entries(sourceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count); // Sort by count descending

      setChartData(processedChartData);

    } catch (err) {
      setError(err.message);
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
          <h1 className="text-3xl font-bold text-gray-900">Leads by Source Report</h1>
          <p className="text-lg text-gray-600 mt-1">Analyze the origin of new leads over a specific period.</p>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* --- Chart --- */}
          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Lead Sources</h3>
             {loading ? (
               <div className="h-96 bg-gray-200 rounded-md animate-pulse"></div>
             ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Lead Count" />
                </BarChart>
              </ResponsiveContainer>
             )}
          </div>

          {/* --- Data Table --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Source Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead className="bg-gray-50">
                  <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3 text-right">Lead Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="2" className="text-center py-10">Loading data...</td></tr>
                  ) : chartData.length > 0 ? (
                    chartData.map((source) => (
                      <tr key={source.name} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{source.name}</p></td>
                        <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{source.count}</p></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="2" className="text-center py-10 text-gray-500">No lead data found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadsBySourceReport;
