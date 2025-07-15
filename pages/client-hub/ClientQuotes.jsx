import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AddQuoteModal from '../../components/AddQuoteModal';
import AddOrderModal from '../../components/AddOrderModal';

const QuoteSection = ({ title, buttonText, onButtonClick, columns, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
      <button 
        onClick={onButtonClick}
        className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition duration-300"
      >
        {buttonText}
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full leading-normal">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col} className="px-5 py-3">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  </div>
);


function ClientQuotes() {
  const { clientData } = useOutletContext();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);

  const fetchQuotes = async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('contact_id', clientData.id)
        .order('quote_date', { ascending: false });
      if (error) throw error;
      setQuotes(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [clientData]);

  const handleAcceptQuote = async (quoteId) => {
    try {
      await supabase.from('quotes').update({ status: 'Accepted', signed_at: new Date().toISOString() }).eq('id', quoteId);
      await supabase.from('contacts').update({ status: 'Active Client', pipeline_stage: 'Won', conversion_date: new Date().toISOString() }).eq('id', clientData.id);
      const { data: eventData } = await supabase.from('events').select('id').eq('contact_id', clientData.id).limit(1).single();
      if (eventData) {
        await supabase.from('events').update({ quote_id: quoteId }).eq('id', eventData.id);
      }
      fetchQuotes();
    } catch (error) {
      setError(`Error accepting quote: ${error.message}`);
    }
  };

  const proposals = quotes.filter(q => q.status !== 'Accepted');
  const orders = quotes.filter(q => q.status === 'Accepted');

  if (loading) return <div>Loading quotes...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-8">
      <QuoteSection
        title="Quotes"
        buttonText="+ New Quote"
        onButtonClick={() => setIsAddQuoteModalOpen(true)}
        columns={['Type', 'Name', 'Price Range', 'Last Viewed', 'Views', 'Expiration', 'Actions']}
      >
        {proposals.length > 0 ? (
          proposals.map((quote) => (
            <tr key={quote.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">Proposal</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">Quote #{quote.id.substring(0, 8)}</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency }).format(quote.total_amount)}</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">N/A</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">0</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">{new Date(quote.quote_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
              <td className="px-5 py-4 text-sm flex items-center space-x-3">
                <Link to={`/quote/${quote.id}/view`} target="_blank" className="text-indigo-600 hover:text-indigo-900">View</Link>
                <button onClick={() => handleAcceptQuote(quote.id)} className="text-green-600 hover:text-green-900">Accept</button>
              </td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="7" className="text-center py-10 text-gray-500">No Quotes. Send a quote to your client so they can book online.</td></tr>
        )}
      </QuoteSection>

      <QuoteSection
        title="Orders"
        buttonText="+ New Order"
        onButtonClick={() => setIsAddOrderModalOpen(true)}
        columns={['Status', 'Name', 'Sold To', 'Sold On', 'Next Invoice', 'Due By', 'Balance', 'Order Total', 'Actions']}
      >
        {orders.length > 0 ? (
          orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-5 py-4 text-sm"><span className="relative inline-block px-3 py-1 font-semibold leading-tight text-green-900"><span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span><span className="relative">{order.status}</span></span></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">Order #{order.id.substring(0, 8)}</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">{clientData.full_name}</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">{new Date(order.signed_at || order.quote_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">N/A</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900">N/A</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.total_amount)}</p></td>
              <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.total_amount)}</p></td>
              <td className="px-5 py-4 text-sm"><Link to={`/quote/${order.id}/view`} target="_blank" className="text-indigo-600 hover:text-indigo-900">View Details</Link></td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="9" className="text-center py-10 text-gray-500">No Booked Orders. Quotes that you or your client book appear here.</td></tr>
        )}
      </QuoteSection>

      <AddQuoteModal isOpen={isAddQuoteModalOpen} onClose={() => setIsAddQuoteModalOpen(false)} onQuoteAdded={fetchQuotes} clientData={clientData} />
      <AddOrderModal isOpen={isAddOrderModalOpen} onClose={() => setIsAddOrderModalOpen(false)} onOrderAdded={fetchQuotes} clientData={clientData} />
    </div>
  );
}

export default ClientQuotes;