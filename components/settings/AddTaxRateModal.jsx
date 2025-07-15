// FILE: src/components/settings/AddTaxRateModal.jsx (New File)
// This is the modal for adding a new tax rate.

import React, { useState } from 'react';
// FIX: Import the supabase client
import { supabase } from '../../utils/supabaseClient';

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);

function AddTaxRateModal({ isOpen, onClose, onRateAdded }) {
  const [formData, setFormData] = useState({ rate_name: '', rate_percentage: '', is_active: true });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from('tax_rates').insert([formData]);
      if (error) throw error;
      onRateAdded();
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
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Add New Tax Rate</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input label="Rate Name" name="rate_name" value={formData.rate_name} onChange={handleChange} required />
            <Input label="Rate (%)" type="number" name="rate_percentage" value={formData.rate_percentage} onChange={handleChange} required step="0.01" />
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded" />
              <label className="text-sm font-medium text-gray-700">Rate is Active</label>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaxRateModal;