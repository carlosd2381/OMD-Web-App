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

const StatusBadge = ({ confirmed }) => {
    const text = confirmed ? 'Confirmed' : 'Pending';
    const colorClasses = confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    return (
        <span className={`font-semibold px-3 py-1 rounded-full text-xs ${colorClasses}`}>
            {text}
        </span>
    );
};


// --- Main Staff Assignments Report Component ---

function StaffAssignmentsReport() {
  const [filters, setFilters] = useState(() => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14); // Default to the next 14 days
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
      // 1. Fetch all events within the date range along with their staff assignments
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          event_name,
          event_date,
          event_staff (
            role_on_event,
            has_confirmed,
            profiles ( full_name )
          )
        `)
        .gte('event_date', filters.startDate)
        .lte('event_date', filters.endDate)
        .order('event_date', { ascending: true });

      if (error) throw error;
      
      setReportData(data || []);

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
          <h1 className="text-3xl font-bold text-gray-900">Staff Assignments Report</h1>
          <p className="text-lg text-gray-600 mt-1">View staff assignments for upcoming events.</p>
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
        
        <div className="space-y-6">
            {loading ? (
                <p className="text-center p-10">Loading assignments...</p>
            ) : reportData.length > 0 ? (
                reportData.map(event => (
                    <div key={event.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                        <div className="border-b pb-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-800">{event.event_name}</h3>
                            <p className="text-sm text-gray-600">{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="text-left text-xs font-semibold text-gray-600 uppercase">
                                    <tr>
                                        <th className="py-2">Staff Member</th>
                                        <th className="py-2">Role on Event</th>
                                        <th className="py-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {event.event_staff.length > 0 ? (
                                        event.event_staff.map((staff, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="py-3 text-sm font-medium text-gray-900">{staff.profiles.full_name}</td>
                                                <td className="py-3 text-sm text-gray-700">{staff.role_on_event}</td>
                                                <td className="py-3 text-sm text-center"><StatusBadge confirmed={staff.has_confirmed} /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="text-center py-4 text-gray-500">No staff assigned to this event yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md border">
                    <p className="text-gray-500">No events with staff assignments found for this period.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default StaffAssignmentsReport;
