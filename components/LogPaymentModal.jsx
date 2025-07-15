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

function LogPaymentModal({ isOpen, onClose, onPaymentLogged, invoice }) {
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'Bank Transfer',
    currency: 'USD',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the form when an invoice is selected
  useEffect(() => {
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        amount: invoice.total_amount - invoice.amount_paid,
        currency: invoice.currency,
      }));
    }
  }, [invoice]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Insert the new payment into the 'payments' table
      const { error: paymentError } = await supabase.from('payments').insert([{
        invoice_id: invoice.id,
        payment_date: formData.payment_date,
        amount: formData.amount,
        currency: formData.currency,
        payment_method: formData.payment_method,
      }]);
      if (paymentError) throw paymentError;

      // Step 2: Update the 'amount_paid' on the invoice
      const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(formData.amount);
      const newStatus = newAmountPaid >= invoice.total_amount ? 'Paid' : 'Partial';

      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ amount_paid: newAmountPaid, status: newStatus })
        .eq('id', invoice.id);
      if (invoiceError) throw invoiceError;

      onPaymentLogged();
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
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Log Payment for Invoice #{invoice.invoice_number}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input label="Payment Date" type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} required />
            <Input label="Amount" type="number" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" />
            <Select label="Payment Method" name="payment_method" value={formData.payment_method} onChange={handleChange}>
              <option>Bank Transfer</option>
              <option>Credit Card</option>
              <option>PayPal</option>
              <option>Cash</option>
              <option>Other</option>
            </Select>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LogPaymentModal;