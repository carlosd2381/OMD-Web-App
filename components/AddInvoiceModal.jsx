import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
      {children}
    </select>
  </div>
);


function AddInvoiceModal({ isOpen, onClose, onInvoiceAdded, clientData }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [formData, setFormData] = useState({
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the client's accepted quotes (orders) when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchOrders = async () => {
        try {
          // UPDATE: We now fetch from 'events' to get the event_id, and join the quote data.
          const { data, error } = await supabase
            .from('events')
            .select(`
              id,
              quotes ( * )
            `)
            .eq('contact_id', clientData.id)
            .eq('quotes.status', 'Accepted')
            .not('quotes', 'is', null); // Ensure we only get events that have a linked quote
          
          if (error) throw error;
          
          // Transform the data to a simple array of orders
          const formattedOrders = data.map(event => ({
            ...event.quotes, // Spread all the quote data
            event_id: event.id // Add the crucial event_id
          }));

          setOrders(formattedOrders);
        } catch (error) {
          setError(error.message);
        }
      };
      fetchOrders();
      // Reset form
      setFormData({
        invoice_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
      });
      setSelectedOrderId('');
      setError(null);
    }
  }, [isOpen, clientData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Please select an order to generate the invoice from.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    try {
      const { error } = await supabase.from('invoices').insert([{
        contact_id: clientData.id,
        // UPDATE: The event_id is now correctly sourced from the selectedOrder object
        event_id: selectedOrder.event_id,
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        total_amount: selectedOrder.total_amount,
        currency: selectedOrder.currency,
        status: 'Draft',
        tax_rate_id: selectedOrder.tax_rate_id,
      }]);

      if (error) throw error;
      
      onInvoiceAdded();
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
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Create New Invoice</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select label="Generate from Order" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} required>
              <option value="">-- Select an Order --</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  Order #{order.id.substring(0, 8)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.total_amount)}
                </option>
              ))}
            </Select>
            <Input label="Invoice Number" name="invoice_number" value={formData.invoice_number} onChange={handleChange} required />
            <Input label="Issue Date" type="date" name="issue_date" value={formData.issue_date} onChange={handleChange} required />
            <Input label="Due Date" type="date" name="due_date" value={formData.due_date} onChange={handleChange} required />
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddInvoiceModal;
