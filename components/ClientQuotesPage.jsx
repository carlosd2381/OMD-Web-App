import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Eye } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusMap = {
    'Draft': { icon: <Clock size={16} />, color: 'bg-gray-200 text-gray-800' },
    'Sent': { icon: <Clock size={16} />, color: 'bg-blue-100 text-blue-800' },
    'Accepted': { icon: <CheckCircle size={16} />, color: 'bg-green-100 text-green-800' },
    'Declined': { icon: <XCircle size={16} />, color: 'bg-red-100 text-red-800' },
  };
  const currentStatus = statusMap[status] || statusMap['Draft'];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${currentStatus.color}`}>
      {currentStatus.icon}
      <span className="ml-2">{status}</span>
    </span>
  );
};

function ClientQuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientQuotes = useCallback(async () => {
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

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('contact_id', contact.id)
        .order('quote_date', { ascending: false });
      
      if (quoteError) throw quoteError;
      setQuotes(quoteData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClientQuotes();
  }, [fetchClientQuotes]);

  const handleAcceptQuote = async (quoteId) => {
    if (window.confirm("Are you sure you want to accept this quote? This will finalize the details and cannot be undone.")) {
      try {
        const { error } = await supabase
          .from('quotes')
          .update({ status: 'Accepted', signed_at: new Date().toISOString() })
          .eq('id', quoteId);
        
        if (error) throw error;
        fetchClientQuotes(); // Refresh the list
      } catch (err) {
        setError(`Error accepting quote: ${err.message}`);
      }
    }
  };
  
  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

  if (loading) return <div className="p-8">Loading your quotes...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Quotes</h1>
          <p className="text-lg text-gray-600 mt-1">Review your quotes and accept them to finalize your event.</p>
        </div>

        {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.length > 0 ? quotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">
                      <p className="font-semibold">{new Date(quote.quote_date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-right">
                      <p className="font-semibold">{formatCurrency(quote.total_amount, quote.currency)}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-center space-x-2">
                      <Link to={`/quote/${quote.id}/view`} target="_blank" className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        <Eye size={16} className="mr-2" /> View
                      </Link>
                      {quote.status === 'Sent' && (
                        <button onClick={() => handleAcceptQuote(quote.id)} className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700">
                          <CheckCircle size={16} className="mr-2" /> Accept Quote
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">You have no quotes to display.</td>
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

export default ClientQuotesPage;
