import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

// --- Reusable Components for the Report ---

const FilterBar = ({ children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
    <div className="flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);

// --- Main Pipeline Funnel Report Component ---

function PipelineFunnelReport() {
  const [filters, setFilters] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pipelineStages = ['New Lead', 'Contacted', 'Proposal Sent', 'Won'];
  const funnelColors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

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
        .select('pipeline_stage');

      if (filters.startDate) query = query.gte('inquiry_date', filters.startDate);
      if (filters.endDate) query = query.lte('inquiry_date', filters.endDate);
      
      const { data, error } = await query;

      if (error) throw error;
      
      const stageCounts = data.reduce((acc, contact) => {
        const stage = contact.pipeline_stage || 'Unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {});

      let cumulativeCount = 0;
      const processedData = pipelineStages.map((stage, index) => {
        const count = stageCounts[stage] || 0;
        // For the funnel, we often show a cumulative view. Let's do a simple stage count for now.
        // A true funnel would count how many leads *reached* that stage. This requires more complex logic.
        // This report will show the current distribution of leads created in the period.
        const conversionRate = index > 0 && stageCounts[pipelineStages[index - 1]] > 0
          ? (count / stageCounts[pipelineStages[index - 1]]) * 100
          : 100;

        return {
          name: stage,
          value: count,
          conversion: conversionRate.toFixed(1),
          fill: funnelColors[index],
        };
      });

      setReportData(processedData);

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
          <h1 className="text-3xl font-bold text-gray-900">Event Pipeline Funnel</h1>
          <p className="text-lg text-gray-600 mt-1">Visualize the current distribution of leads created in a period.</p>
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
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Funnel</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* --- Chart --- */}
            <div className="w-full h-80">
               {loading ? (
                 <div className="h-full bg-gray-200 rounded-md animate-pulse"></div>
               ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={reportData.filter(d => d.value > 0)}
                      isAnimationActive
                    >
                      <LabelList position="right" fill="#000" stroke="none" dataKey="name" formatter={(value) => value} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
               )}
            </div>

            {/* --- Data Table --- */}
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead className="bg-gray-50">
                  <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3 text-right">Lead Count</th>
                    <th className="px-5 py-3 text-right">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="3" className="text-center py-10">Loading data...</td></tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((stage, index) => (
                      <tr key={stage.name} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{stage.name}</p></td>
                        <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{stage.value}</p></td>
                        <td className="px-5 py-4 text-sm text-right"><p className="text-gray-600">{index > 0 ? `${stage.conversion}%` : '--'}</p></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="text-center py-10 text-gray-500">No data found for this period.</td></tr>
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

export default PipelineFunnelReport;
