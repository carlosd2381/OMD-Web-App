import React, { useState, useEffect } from 'react';
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

function EditExpenseModal({ isOpen, onClose, onExpenseUpdated, editingExpense }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the form when an expense is selected for editing
  useEffect(() => {
    if (editingExpense) {
      setFormData(editingExpense);
    }
  }, [editingExpense]);

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
      const { id, ...updateData } = formData;
      const { error } = await supabase.from('event_expenses').update(updateData).eq('id', id);
      if (error) throw error;
      onExpenseUpdated();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input label="Name / Description" name="description" value={formData.description || ''} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount Paid" type="number" name="amount" value={formData.amount || ''} onChange={handleChange} required step="0.01" />
              <Select label="Currency" name="currency" value={formData.currency || 'MXN'} onChange={handleChange}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </Select>
            </div>
            <Input label="Account Paid From" name="account_paid_from" value={formData.account_paid_from || ''} onChange={handleChange} />
            <Input label="Date of Expense" type="date" name="expense_date" value={formData.expense_date || ''} onChange={handleChange} required />
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;
