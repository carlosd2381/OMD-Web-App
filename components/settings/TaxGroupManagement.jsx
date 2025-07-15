// FILE: src/components/settings/TaxGroupManagement.jsx (Updated)
// This component now handles the logic for both Add, Edit, and Delete modals.

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddTaxGroupModal from './AddTaxGroupModal';
import EditTaxGroupModal from './EditTaxGroupModal';

function TaxGroupManagement() {
  const [taxGroups, setTaxGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const fetchTaxGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_groups')
        .select(`
          id,
          name,
          is_default,
          tax_group_items (
            tax_rate_id,
            priority,
            tax_rates (
              id,
              rate_name,
              rate_percentage
            )
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      
      const groupsWithTotals = data.map(group => {
        const totalRate = group.tax_group_items.reduce((acc, item) => acc + item.tax_rates.rate_percentage, 0);
        const sortedItems = group.tax_group_items.sort((a, b) => a.priority - b.priority);
        return { ...group, totalRate, tax_group_items: sortedItems };
      });

      setTaxGroups(groupsWithTotals);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxGroups();
  }, [fetchTaxGroups]);

  const handleEdit = (group) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this tax group?')) {
      try {
        const { error } = await supabase.from('tax_groups').delete().eq('id', groupId);
        if (error) throw error;
        fetchTaxGroups();
      } catch (error) {
        setError(`Error deleting tax group: ${error.message}`);
      }
    }
  };

  if (loading) return <div>Loading tax groups...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Tax Groups</h3>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[var(--color-brand-brown)] text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition duration-300"
        >
          + New Tax Group
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Default</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Rate</th>
              <th className="px-5 py-3">Tax Line 1</th>
              <th className="px-5 py-3">Tax Line 2</th>
              <th className="px-5 py-3">Tax Line 3</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxGroups.map((group) => (
              <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-5 py-4 text-sm text-center">
                  <input type="radio" name="default-tax-group" checked={group.is_default} readOnly />
                </td>
                <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap font-semibold">{group.name}</p></td>
                <td className="px-5 py-4 text-sm"><p className="text-gray-900">{group.totalRate.toFixed(4)}%</p></td>
                <td className="px-5 py-4 text-sm"><p className="text-gray-900">{group.tax_group_items[0]?.tax_rates.rate_name || 'none'}</p></td>
                <td className="px-5 py-4 text-sm"><p className="text-gray-900">{group.tax_group_items[1]?.tax_rates.rate_name || 'none'}</p></td>
                <td className="px-5 py-4 text-sm"><p className="text-gray-900">{group.tax_group_items[2]?.tax_rates.rate_name || 'none'}</p></td>
                <td className="px-5 py-4 text-sm flex items-center space-x-3">
                  <button onClick={() => handleEdit(group)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                  <button onClick={() => handleDelete(group.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddTaxGroupModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onGroupAdded={fetchTaxGroups}
      />
      <EditTaxGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onGroupUpdated={fetchTaxGroups}
        editingGroup={editingGroup}
      />
    </div>
  );
}

export default TaxGroupManagement;