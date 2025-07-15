import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusMap = {
    'Draft': { icon: <Clock size={16} />, color: 'bg-gray-200 text-gray-800' },
    'Sent': { icon: <Clock size={16} />, color: 'bg-blue-100 text-blue-800' },
    'Partial': { icon: <Clock size={16} />, color: 'bg-yellow-100 text-yellow-800' },
    'Paid': { icon: <CheckCircle size={16} />, color: 'bg-green-100 text-green-800' },
    'Overdue': { icon: <AlertTriangle size={16} />, color: 'bg-red-100 text-red-800' },
  };
  const currentStatus = statusMap[status] || statusMap['Draft'];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${currentStatus.color}`}>
      {currentStatus.icon}
      <span className="ml-2">{status}</span>
    </span>
  );
};

function ClientInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (contactError || !contact) throw new Error("Could not find your contact information.");

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('contact_id', contact.id)
        .order('issue_date', { ascending: false });
      
      if (invoiceError) throw invoiceError;
      setInvoices(invoiceData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClientInvoices();
  }, [fetchClientInvoices]);
  
  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

  if (loading) return <div className="p-8">Loading your invoices...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Invoices</h1>
          <p className="text-lg text-gray-600 mt-1">Review your invoice history and make payments.</p>
        </div>

        {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.length > 0 ? invoices.map(invoice => {
                  const balanceDue = invoice.total_amount - invoice.amount_paid;
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="font-semibold">{invoice.invoice_number}</p></td>
                      <td className="px-5 py-4 text-sm">{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-sm"><StatusBadge status={invoice.status} /></td>
                      <td className="px-5 py-4 text-sm text-right font-bold text-red-600">{formatCurrency(balanceDue, invoice.currency)}</td>
                      <td className="px-5 py-4 text-sm text-center">
                        {balanceDue > 0 && (
                           <Link to={`/portal/checkout/${invoice.id}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700">
                             <CreditCard size={16} className="mr-2" /> Pay Now
                           </Link>
                        )}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">You have no invoices to display.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientInvoicesPage;
