import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
  </div>
);

const Select = ({ label, children, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
        {children}
      </select>
    </div>
);

function AddCommissionModal({ isOpen, onClose, onCommissionAdded, eventId }) {
  const [formData, setFormData] = useState({
    commission_type: 'Venue',
    percentage: '',
    amount: '',
    currency: 'MXN',
    payment_method: 'Bank Transfer',
    account_paid_from: '',
    to_account: '',
    paid_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const { error } = await supabase.from('commissions').insert([{ 
        event_id: eventId,
        ...formData 
      }]);
      if (error) throw error;
      onCommissionAdded();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Add Commission</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Commission Type" name="commission_type" value={formData.commission_type} onChange={handleChange}>
                <option>Venue</option>
                <option>Planner</option>
                <option>Referral</option>
            </Select>
            <Input label="Percentage (%)" type="number" name="percentage" value={formData.percentage} onChange={handleChange} step="0.01" />
            <Input label="Amount" type="number" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" />
             <Select label="Currency" name="currency" value={formData.currency} onChange={handleChange}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </Select>
            <Select label="Payment Method" name="payment_method" value={formData.payment_method} onChange={handleChange}>
                <option>Bank Transfer</option>
                <option>Credit Card</option>
                <option>Cash</option>
            </Select>
            <Input label="Account Paid From" name="account_paid_from" value={formData.account_paid_from} onChange={handleChange} />
            <Input label="To Account" name="to_account" value={formData.to_account} onChange={handleChange} />
            <Input label="Paid Date" type="date" name="paid_date" value={formData.paid_date} onChange={handleChange} required />
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Commission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCommissionModal;