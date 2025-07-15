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

// --- Main Equipment Usage Report Component ---

function EquipmentUsageReport() {
  const [filters, setFilters] = useState(() => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // Default to the next 30 days
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const [reportData, setReportData] = useState([]);
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
      // Fetch all events within the date range that have equipment assigned
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          event_name,
          event_date,
          event_equipment (
            equipment ( name, type )
          )
        `)
        .gte('event_date', filters.startDate)
        .lte('event_date', filters.endDate)
        .order('event_date', { ascending: true });

      if (error) throw error;
      
      // Filter out events that don't have any equipment assigned
      const eventsWithEquipment = data.filter(event => event.event_equipment.length > 0);
      setReportData(eventsWithEquipment);

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
          <h1 className="text-3xl font-bold text-gray-900">Equipment Usage Report</h1>
          <p className="text-lg text-gray-600 mt-1">View equipment assignments for upcoming events.</p>
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
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Event Date</th>
                  <th className="px-5 py-3">Event Name</th>
                  <th className="px-5 py-3">Assigned Equipment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="3" className="text-center py-10">Loading assignments...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{new Date(event.event_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{event.event_name}</p></td>
                      <td className="px-5 py-4 text-sm">
                        <ul className="list-disc list-inside">
                          {event.event_equipment.map((item, index) => (
                            <li key={index} className="text-gray-800">{item.equipment.name} ({item.equipment.type})</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="text-center py-10 text-gray-500">No events with equipment assignments found for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentUsageReport;
