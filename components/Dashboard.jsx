import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { Users, Calendar, AlertTriangle, CheckCircle, FileText, UserPlus, TrendingDown, DollarSign } from 'lucide-react';

// --- Reusable Components for the Dashboard ---

const KpiCard = ({ title, value, isLoading, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center">
      <div className="p-3 rounded-full mr-4" style={{ backgroundColor: `${color}1A` }}>
        {React.cloneElement(icon, { style: { color } })}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
        {isLoading ? (
          <div className="h-8 bg-gray-200 rounded-md animate-pulse mt-1 w-32"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        )}
      </div>
    </div>
  </div>
);

const DashboardSection = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
    <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
    {children}
  </div>
);

const ActivityItem = ({ type, text, date, linkTo }) => {
  const icons = {
    new_lead: <UserPlus size={20} className="text-blue-500" />,
    quote_accepted: <FileText size={20} className="text-green-500" />,
    invoice_paid: <CheckCircle size={20} className="text-purple-500" />,
  };

  return (
    <Link to={linkTo} className="flex items-start space-x-4 p-3 rounded-md hover:bg-gray-100">
      <div className="flex-shrink-0 mt-1">{icons[type]}</div>
      <div>
        <p className="text-sm text-gray-800">{text}</p>
        <p className="text-xs text-gray-500">{new Date(date).toLocaleString()}</p>
      </div>
    </Link>
  );
};


// --- Main Dashboard Component ---

function Dashboard() {
  const [stats, setStats] = useState({});
  const [funnelData, setFunnelData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);

      const responses = await Promise.all([
        supabase.from('invoices').select('total_amount, event_id').eq('status', 'Paid'),
        supabase.from('invoices').select('total_amount, amount_paid').not('status', 'eq', 'Paid'),
        supabase.from('contacts').select('pipeline_stage'),
        supabase.from('events').select('id, event_name, event_date, contact_id').gte('event_date', today.toISOString()).order('event_date').limit(5),
        supabase.from('events').select('id', { count: 'exact' }).gte('event_date', firstDayOfMonth),
        supabase.from('contacts').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('quotes').select('id, contact_id, signed_at, contacts(full_name)').eq('status', 'Accepted').order('signed_at', { ascending: false }).limit(5),
        supabase.from('payments').select('amount, payment_date, invoices(contact_id, contacts(full_name))').order('payment_date', { ascending: false }).limit(5),
        supabase.from('event_expenses').select('amount'),
        supabase.from('commissions').select('amount, paid_date').gte('paid_date', sixMonthsAgo.toISOString()),
        supabase.from('event_payroll').select('amount, paid_date').gte('paid_date', sixMonthsAgo.toISOString()),
      ]);

      for (const res of responses) {
        if (res.error) throw res.error;
      }
      
      const [
        paidInvoicesRes, unpaidInvoicesRes, funnelRes, eventsRes, eventsThisMonthRes, 
        newLeadsActivityRes, acceptedQuotesActivityRes, paymentsActivityRes,
        expensesRes, commissionsRes, payrollRes
      ] = responses;

      // --- Calculate COGS ---
      const paidEventIds = paidInvoicesRes.data.map(inv => inv.event_id).filter(id => id);
      let totalCogs = 0;
      if (paidEventIds.length > 0) {
        const { data: eventsWithQuotes, error: eventsError } = await supabase.from('events').select('quotes(id)').in('id', paidEventIds);
        if (eventsError) throw eventsError;

        const quoteIds = eventsWithQuotes.map(e => e.quotes?.id).filter(id => id);
        if (quoteIds.length > 0) {
          const { data: items, error: itemsError } = await supabase.from('quote_items').select('quantity, menu_items(item_cost)').in('quote_id', quoteIds);
          if (itemsError) throw itemsError;
          totalCogs = items.reduce((acc, item) => acc + (item.quantity * item.menu_items.item_cost), 0);
        }
      }

      const totalRevenue = paidInvoicesRes.data.reduce((acc, inv) => acc + inv.total_amount, 0);
      const openInvoices = unpaidInvoicesRes.data.reduce((acc, inv) => acc + (inv.total_amount - inv.amount_paid), 0);
      const totalExpenses = expensesRes.data.reduce((acc, exp) => acc + exp.amount, 0);
      const totalCommissions = commissionsRes.data.reduce((acc, com) => acc + com.amount, 0);
      const totalPayroll = payrollRes.data.reduce((acc, pay) => acc + pay.amount, 0);
      const totalCosts = totalExpenses + totalCommissions + totalPayroll + totalCogs;
      const netProfit = totalRevenue - totalCosts;

      setStats({
        totalRevenue: formatCurrency(totalRevenue),
        openInvoices: formatCurrency(openInvoices),
        newLeads: funnelRes.data.filter(c => c.pipeline_stage === 'New Lead').length,
        eventsThisMonth: eventsThisMonthRes.count,
        totalExpenses: formatCurrency(totalCosts),
        netProfit: formatCurrency(netProfit),
      });

      const pipelineStages = ['New Lead', 'Contacted', 'Proposal Sent', 'Won'];
      const stageCounts = funnelRes.data.reduce((acc, contact) => {
        acc[contact.pipeline_stage] = (acc[contact.pipeline_stage] || 0) + 1;
        return acc;
      }, {});
      setFunnelData(pipelineStages.map((stage, index) => ({
        name: stage, value: stageCounts[stage] || 0, fill: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'][index],
      })));

      const newLeadsActivity = newLeadsActivityRes.data.map(c => ({ type: 'new_lead', text: `New lead created: ${c.full_name}`, date: c.created_at, linkTo: `/client-hub/${c.id}` }));
      const acceptedQuotesActivity = acceptedQuotesActivityRes.data.map(q => ({ type: 'quote_accepted', text: `Quote accepted by ${q.contacts.full_name}`, date: q.signed_at, linkTo: `/client-hub/${q.contact_id}/quotes` }));
      const paidInvoicesActivity = paymentsActivityRes.data.map(p => ({ type: 'invoice_paid', text: `Payment of ${formatCurrency(p.amount)} received from ${p.invoices.contacts.full_name}`, date: p.payment_date, linkTo: `/client-hub/${p.invoices.contact_id}/financials` }));
      setRecentActivity([...newLeadsActivity, ...acceptedQuotesActivity, ...paidInvoicesActivity].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7));

      setUpcomingEvents(eventsRes.data);

      const costByMonth = {};
      const monthNames = [...Array(6)].map((_, i) => {
          const d = new Date();
          d.setMonth(today.getMonth() - i);
          return d.toLocaleString('default', { month: 'short' });
      }).reverse();

      monthNames.forEach(m => costByMonth[m] = { name: m, Commissions: 0, Payroll: 0 });
      [...commissionsRes.data, ...payrollRes.data].forEach(item => {
        const month = new Date(item.paid_date).toLocaleString('default', { month: 'short' });
        if (costByMonth[month]) {
          if (item.commission_type) costByMonth[month].Commissions += item.amount;
          else costByMonth[month].Payroll += item.amount;
        }
      });
      setCostData(Object.values(costByMonth));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-600 mt-1">Welcome back! Here's a summary of your business.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KpiCard title="Total Revenue (All Time)" value={stats.totalRevenue} isLoading={loading} icon={<CheckCircle size={24} />} color="#10b981" />
          <KpiCard title="Total Costs" value={stats.totalExpenses} isLoading={loading} icon={<TrendingDown size={24} />} color="#ef4444" />
          <KpiCard title="Net Profit" value={stats.netProfit} isLoading={loading} icon={<DollarSign size={24} />} color="#14b8a6" />
          <KpiCard title="Open Invoices" value={stats.openInvoices} isLoading={loading} icon={<AlertTriangle size={24} />} color="#f59e0b" />
          <KpiCard title="New Leads" value={stats.newLeads} isLoading={loading} icon={<Users size={24} />} color="#3b82f6" />
          <KpiCard title="Events This Month" value={stats.eventsThisMonth} isLoading={loading} icon={<Calendar size={24} />} color="#6366f1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DashboardSection title="Sales Pipeline">
              {loading ? <div className="h-80 bg-gray-200 rounded-md animate-pulse"></div> : (
                <ResponsiveContainer width="100%" height={320}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel dataKey="value" data={funnelData.filter(d => d.value > 0)} isAnimationActive>
                      <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}
            </DashboardSection>
            
             <DashboardSection title="Commission & Payroll (Last 6 Months)">
              {loading ? <div className="h-80 bg-gray-200 rounded-md animate-pulse"></div> : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Commissions" stackId="a" fill="#8884d8" />
                    <Bar dataKey="Payroll" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </DashboardSection>
          </div>

          <div className="space-y-8">
            <DashboardSection title="Upcoming Events">
              <div className="space-y-4">
                {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse"></div>) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <Link to={`/client-hub/${event.contact_id}/event-sheet`} key={event.id} className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100">
                      <p className="font-semibold text-gray-800">{event.event_name}</p>
                      <p className="text-sm text-gray-500">{new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>
                    </Link>
                  ))
                ) : <p className="text-gray-500 text-center py-8">No upcoming events.</p>}
              </div>
            </DashboardSection>
            <DashboardSection title="Recent Activity">
              <div className="space-y-2">
                {loading ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse"></div>) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => <ActivityItem key={index} {...activity} />)
                ) : <p className="text-gray-500 text-center py-8">No recent activity.</p>}
              </div>
            </DashboardSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
