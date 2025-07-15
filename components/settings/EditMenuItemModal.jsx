import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);

function EditMenuItemModal({ isOpen, onClose, onItemUpdated, editingItem }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    }
  }, [editingItem]);

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
      const { id, ...updateData } = formData;
      const { error } = await supabase.from('menu_items').update(updateData).eq('id', id);
      if (error) throw error;
      onItemUpdated();
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
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Edit Menu Item</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Item Name" name="name" value={formData.name || ''} onChange={handleChange} required />
            <Input label="Category" name="category" value={formData.category || ''} onChange={handleChange} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
            <Input label="Item Cost ($)" type="number" name="item_cost" value={formData.item_cost || ''} onChange={handleChange} required step="0.01" />
            <Input label="Public Price ($)" type="number" name="public_price" value={formData.public_price || ''} onChange={handleChange} required step="0.01" />
            <Input label="Partner Price ($)" type="number" name="partner_price" value={formData.partner_price || ''} onChange={handleChange} required step="0.01" />
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={handleChange} className="h-4 w-4 rounded" />
              <label className="text-sm font-medium text-gray-700">Item is Active</label>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMenuItemModal;
