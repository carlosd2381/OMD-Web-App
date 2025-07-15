import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

// --- Reusable Components for the Report ---

const SummaryCard = ({ title, value, isLoading, colorClass = 'text-gray-800' }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
    {isLoading ? (
      <div className="h-8 bg-gray-200 rounded-md animate-pulse mt-2"></div>
    ) : (
      <p className={`text-3xl font-bold ${colorClass} mt-1`}>{value}</p>
    )}
  </div>
);

const DetailTable = ({ title, columns, data, formatValue, emptyText }) => (
  <div>
    <h4 className="text-lg font-semibold text-gray-700 mb-2">{title}</h4>
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full leading-normal">
        <thead className="bg-gray-50">
          <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {columns.map(col => <th key={col.key} className="px-5 py-3">{col.header}</th>)}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data && data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-5 py-4 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {formatValue ? formatValue(row, col.key) : row[col.key]}
                    </p>
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr><td colSpan={columns.length} className="text-center py-6 text-gray-500">{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);


// --- Main Event P&L Report Component ---

function EventPnlReport() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all events for the dropdown selector
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, event_name, event_date')
        .order('event_date', { ascending: false });
      
      if (error) {
        setError(error.message);
      } else {
        setEvents(data);
        if (data && data.length > 0) {
          // Uncomment to automatically select the latest event
          // setSelectedEventId(data[0].id);
        }
      }
    };
    fetchEvents();
  }, []);

  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const generateReport = useCallback(async () => {
    if (!selectedEventId) {
      setReportData(null);
      return;
    };
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          quotes!inner(*, quote_items!inner(quantity, menu_items(name, item_cost))),
          event_expenses(*),
          commissions(*),
          event_payroll(*)
        `)
        .eq('id', selectedEventId)
        .single();

      if (error) throw error;
      
      // Calculate financials
      const revenue = data.quotes?.total_amount || 0;
      const cogs = data.quotes?.quote_items.reduce((acc, item) => acc + (item.menu_items.item_cost * item.quantity), 0) || 0;
      const expenses = data.event_expenses.reduce((acc, exp) => acc + exp.amount, 0) || 0;
      const commissions = data.commissions.reduce((acc, com) => acc + com.amount, 0) || 0;
      const payroll = data.event_payroll.reduce((acc, pay) => acc + pay.amount, 0) || 0;
      const totalCosts = cogs + expenses + commissions + payroll;
      const profit = revenue - totalCosts;

      setReportData({
        summary: { revenue, totalCosts, profit, cogs, expenses, commissions, payroll },
        details: {
          cogs: data.quotes.quote_items,
          expenses: data.event_expenses,
          commissions: data.commissions,
          payroll: data.event_payroll,
        }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);
  
  useEffect(() => {
    generateReport();
  }, [generateReport]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Individual Event P&L Report</h1>
          <p className="text-lg text-gray-600 mt-1">Analyze the profitability of a single event.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
          <label htmlFor="eventSelector" className="block text-sm font-medium text-gray-700 mb-1">Select an Event</label>
          <select
            id="eventSelector"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">-- Please choose an event --</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {new Date(event.event_date).toLocaleDateString(undefined, { timeZone: 'UTC' })} - {event.event_name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

        {loading && <div className="text-center p-10">Loading report...</div>}

        {!selectedEventId && !loading && (
          <div className="text-center p-10 bg-white rounded-lg shadow-md border">
            <p className="text-gray-500">Please select an event to generate a report.</p>
          </div>
        )}

        {reportData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="Total Revenue" value={formatCurrency(reportData.summary.revenue)} colorClass="text-green-600" isLoading={loading} />
              <SummaryCard title="Total Costs" value={formatCurrency(reportData.summary.totalCosts)} colorClass="text-red-600" isLoading={loading} />
              <SummaryCard title="Gross Profit" value={formatCurrency(reportData.summary.profit)} colorClass={reportData.summary.profit > 0 ? 'text-blue-600' : 'text-red-600'} isLoading={loading} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 space-y-6">
              <DetailTable
                title="Cost of Goods Sold (COGS)"
                columns={[{ key: 'name', header: 'Item' }, { key: 'quantity', header: 'Quantity' }, { key: 'cost', header: 'Total Cost (MXN)' }]}
                data={reportData.details.cogs}
                formatValue={(row, key) => {
                  if (key === 'name') return row.menu_items.name;
                  if (key === 'quantity') return row.quantity;
                  if (key === 'cost') return formatCurrency(row.menu_items.item_cost * row.quantity, 'MXN');
                  return '';
                }}
                emptyText="No cost data found for this event."
              />
               <DetailTable
                title="Expenses"
                columns={[{ key: 'expense_date', header: 'Date' }, { key: 'description', header: 'Description' }, { key: 'amount', header: 'Amount' }]}
                data={reportData.details.expenses}
                formatValue={(row, key) => key === 'amount' ? formatCurrency(row.amount, row.currency) : new Date(row[key]).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                emptyText="No expenses logged for this event."
              />
              <DetailTable
                title="Commissions"
                columns={[{ key: 'commission_type', header: 'Type' }, { key: 'to_account', header: 'Paid To' }, { key: 'amount', header: 'Amount' }]}
                data={reportData.details.commissions}
                formatValue={(row, key) => key === 'amount' ? formatCurrency(row.amount, row.currency) : row[key]}
                emptyText="No commissions logged for this event."
              />
              <DetailTable
                title="Payroll"
                columns={[{ key: 'job_title', header: 'Job' }, { key: 'employee_name', header: 'Employee' }, { key: 'amount', header: 'Amount' }]}
                data={reportData.details.payroll}
                formatValue={(row, key) => key === 'amount' ? formatCurrency(row.amount, 'USD') : row[key]}
                emptyText="No payroll logged for this event."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPnlReport;
