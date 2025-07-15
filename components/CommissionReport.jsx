import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

// --- Reusable Components for the Report ---

const FilterBar = ({ children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
    <div className="flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);

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

// --- Main Commission Report Component ---

function CommissionReport() {
  const [filters, setFilters] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      partner_id: '',
    };
  });

  const [partners, setPartners] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ totalCommission: 0, eventCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all partners for the dropdown selector
  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase.from('partners').select('id, company_name').order('company_name');
      if (error) {
        console.error("Error fetching partners:", error);
      } else {
        setPartners(data);
      }
    };
    fetchPartners();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

  const generateReport = useCallback(async () => {
    if (!filters.partner_id) {
        alert("Please select a partner to generate a report.");
        return;
    }
    setLoading(true);
    setError(null);
    setReportData([]);

    try {
      // 1. Find all contacts associated with the selected partner
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('partner_id', filters.partner_id);
      if (contactsError) throw contactsError;
      const contactIds = contacts.map(c => c.id);

      if (contactIds.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Find all events for those contacts within the date range
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, event_name')
        .in('contact_id', contactIds)
        .gte('event_date', filters.startDate)
        .lte('event_date', filters.endDate);
      if (eventsError) throw eventsError;
      const eventIds = events.map(e => e.id);
      
      if (eventIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Fetch all commissions for those events
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .in('event_id', eventIds);
      if (commissionsError) throw commissionsError;

      // 4. Map commissions to their events
      const finalData = commissions.map(comm => {
          const event = events.find(e => e.id === comm.event_id);
          return { ...comm, event_name: event?.event_name || 'N/A' };
      });
      
      setReportData(finalData);

      // 5. Calculate summary
      const totalCommission = finalData.reduce((acc, comm) => acc + comm.amount, 0);
      setSummary({ totalCommission, eventCount: eventIds.length });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Partner Commission Report</h1>
          <p className="text-lg text-gray-600 mt-1">Review commission history for a specific partner.</p>
        </div>

        <FilterBar>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="partner_id" className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
            <select name="partner_id" id="partner_id" value={filters.partner_id} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">Select a partner</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
            </select>
          </div>
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
            <SummaryCard title="Total Commission Paid" value={formatCurrency(summary.totalCommission)} isLoading={loading} />
            <SummaryCard title="Number of Events" value={summary.eventCount.toLocaleString()} isLoading={loading} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Commission Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Paid Date</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10">Loading report...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((comm) => (
                    <tr key={comm.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{new Date(comm.paid_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{comm.event_name}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{comm.commission_type}</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold">{formatCurrency(comm.amount, comm.currency)}</p></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-10 text-gray-500">No commissions found for this partner in the selected period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionReport;
