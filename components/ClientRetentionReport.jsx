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

// --- Main Client Retention Report Component ---

function ClientRetentionReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ totalClients: 0, repeatClients: 0, retentionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all contacts and their associated event counts
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          full_name,
          email,
          events ( count )
        `);

      if (error) throw error;

      // 2. Process the data to find repeat clients
      const repeatClients = data.filter(contact => contact.events[0]?.count > 1);
      
      setReportData(repeatClients.map(client => ({
        ...client,
        event_count: client.events[0]?.count
      })).sort((a,b) => b.event_count - a.event_count));

      // 3. Calculate summary metrics
      const totalClients = data.length;
      const repeatClientCount = repeatClients.length;
      const retentionRate = totalClients > 0 ? (repeatClientCount / totalClients) * 100 : 0;

      setSummary({
        totalClients: totalClients,
        repeatClients: repeatClientCount,
        retentionRate: retentionRate.toFixed(1),
      });

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
          <h1 className="text-3xl font-bold text-gray-900">Client Retention Report</h1>
          <p className="text-lg text-gray-600 mt-1">Identify repeat clients who have booked multiple events.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Total Clients" value={summary.totalClients.toLocaleString()} isLoading={loading} />
            <SummaryCard title="Repeat Clients" value={summary.repeatClients.toLocaleString()} isLoading={loading} />
            <SummaryCard title="Retention Rate" value={`${summary.retentionRate}%`} isLoading={loading} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Repeat Client Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Client Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-right">Events Booked</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="3" className="text-center py-10">Loading data...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{client.full_name}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{client.email}</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{client.event_count}</p></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="text-center py-10 text-gray-500">No repeat clients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientRetentionReport;
