// FILE: src/components/settings/AddTaxGroupModal.jsx
// This is the modal for creating a new tax group.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);

function AddTaxGroupModal({ isOpen, onClose, onGroupAdded }) {
  const [groupName, setGroupName] = useState('');
  const [availableRates, setAvailableRates] = useState([]);
  const [selectedRates, setSelectedRates] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchRates = async () => {
        try {
          const { data, error } = await supabase.from('tax_rates').select('*').eq('is_active', true);
          if (error) throw error;
          setAvailableRates(data);
        } catch (error) {
          setError(error.message);
        }
      };
      fetchRates();
      setGroupName('');
      setSelectedRates([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckboxChange = (e, rate) => {
    if (e.target.checked) {
      setSelectedRates([...selectedRates, rate]);
    } else {
      setSelectedRates(selectedRates.filter(r => r.id !== rate.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName || selectedRates.length === 0) {
      setError('Please provide a group name and select at least one tax rate.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('tax_groups')
        .insert({ name: groupName })
        .select()
        .single();
      if (groupError) throw groupError;

      const groupItemsToInsert = selectedRates.map((rate, index) => ({
        tax_group_id: groupData.id,
        tax_rate_id: rate.id,
        priority: index,
      }));

      const { error: itemsError } = await supabase.from('tax_group_items').insert(groupItemsToInsert);
      if (itemsError) throw itemsError;

      onGroupAdded();
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
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Add New Tax Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Input label="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
            <div>
              <label className="block text-sm font-medium text-gray-700">Included Tax Rates</label>
              <div className="mt-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                {availableRates.length > 0 ? (
                  availableRates.map(rate => (
                    <label key={rate.id} className="flex items-center space-x-3 py-1">
                      <input 
                        type="checkbox"
                        checked={selectedRates.some(r => r.id === rate.id)}
                        onChange={(e) => handleCheckboxChange(e, rate)}
                        className="h-4 w-4 rounded"
                      />
                      <span>{rate.rate_name} ({rate.rate_percentage}%)</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">No active tax rates found.</p>
                )}
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaxGroupModal;