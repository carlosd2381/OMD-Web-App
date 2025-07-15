import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

function AddContractModal({ isOpen, onClose, onContractAdded, clientData }) {
  const [orders, setOrders] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the client's accepted quotes (orders) when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('id, total_amount, currency')
            .eq('contact_id', clientData.id)
            .eq('status', 'Accepted');
          
          if (error) throw error;
          setOrders(data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
      // Reset form state
      setSelectedQuoteId('');
      setError(null);
    }
  }, [isOpen, clientData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuoteId) {
      setError('Please select an order to generate a contract from.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from('contracts').insert([{
        contact_id: clientData.id,
        quote_id: selectedQuoteId,
        status: 'Draft', // Default status for a new contract
      }]);

      if (error) throw error;
      
      onContractAdded();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Create New Contract</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Generate from Order</label>
              <select 
                value={selectedQuoteId} 
                onChange={(e) => setSelectedQuoteId(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">-- Select an Order --</option>
                {loading ? <option>Loading...</option> : orders.map(order => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id.substring(0, 8)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.total_amount)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddContractModal;
