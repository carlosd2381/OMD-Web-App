// FILE: src/components/settings/TaxManagement.jsx (New File)
// This component displays the table of tax rates.

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddTaxRateModal from './AddTaxRateModal';
import EditTaxRateModal from './EditTaxRateModal';

function TaxManagement() {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  const fetchTaxRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tax_rates').select('*').order('rate_name', { ascending: true });
      if (error) throw error;
      setTaxRates(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (rateId) => {
    if (window.confirm('Are you sure you want to delete this tax rate?')) {
      try {
        const { error } = await supabase.from('tax_rates').delete().eq('id', rateId);
        if (error) throw error;
        fetchTaxRates();
      } catch (error) {
        setError(`Error deleting tax rate: ${error.message}`);
      }
    }
  };

  if (loading) return <div>Loading tax rates...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Tax Rate Management</h3>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--color-brand-brown)] text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition duration-300">
          + Add New Tax Rate
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Rate Name</th>
              <th className="px-5 py-3 text-right">Rate (%)</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxRates.map((rate) => (
              <tr key={rate.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap font-semibold">{rate.rate_name}</p></td>
                <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{rate.rate_percentage}%</p></td>
                <td className="px-5 py-4 text-sm text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {rate.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm flex items-center space-x-3">
                  <button onClick={() => handleEdit(rate)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                  <button onClick={() => handleDelete(rate.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddTaxRateModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onRateAdded={fetchTaxRates} />
      <EditTaxRateModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onRateUpdated={fetchTaxRates} editingRate={editingRate} />
    </div>
  );
}

export default TaxManagement;