import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Main Vendor Performance Report Component ---

function VendorPerformanceReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all partners and their associated contacts, including the pipeline stage
      const { data, error } = await supabase
        .from('partners')
        .select(`
          id,
          company_name,
          contacts (
            pipeline_stage
          )
        `);

      if (error) throw error;
      
      // Process the data to calculate performance metrics for each partner
      const performanceData = data.map(partner => {
        const totalLeads = partner.contacts.length;
        const wonLeads = partner.contacts.filter(c => c.pipeline_stage === 'Won').length;
        const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

        return {
          name: partner.company_name,
          totalLeads,
          wonLeads,
          conversionRate: conversionRate.toFixed(1),
        };
      }).sort((a, b) => b.wonLeads - a.wonLeads); // Sort by most won leads

      setReportData(performanceData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Preferred Vendor Performance</h1>
          <p className="text-lg text-gray-600 mt-1">Analyze lead generation and conversion rates for each partner.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Partner Performance Metrics</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* --- Chart --- */}
            <div className="w-full h-96">
               {loading ? (
                 <div className="h-full bg-gray-200 rounded-md animate-pulse"></div>
               ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalLeads" fill="#8884d8" name="Total Leads" />
                    <Bar dataKey="wonLeads" fill="#82ca9d" name="Won Leads" />
                  </BarChart>
                </ResponsiveContainer>
               )}
            </div>

            {/* --- Data Table --- */}
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead className="bg-gray-50">
                  <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-5 py-3">Partner</th>
                    <th className="px-5 py-3 text-right">Total Leads</th>
                    <th className="px-5 py-3 text-right">Won Leads</th>
                    <th className="px-5 py-3 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="4" className="text-center py-10">Loading data...</td></tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((partner) => (
                      <tr key={partner.name} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{partner.name}</p></td>
                        <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{partner.totalLeads}</p></td>
                        <td className="px-5 py-4 text-sm text-right"><p className="text-green-600 font-semibold">{partner.wonLeads}</p></td>
                        <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{partner.conversionRate}%</p></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="text-center py-10 text-gray-500">No partner data found.</td></tr>
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

export default VendorPerformanceReport;
