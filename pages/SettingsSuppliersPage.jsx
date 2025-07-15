import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link } from 'react-router-dom';

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Add/Edit Supplier Form ---
const SupplierForm = ({ onSave, onCancel, item }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    contact_person: item?.contact_person || '',
    email: item?.email || '',
    phone: item?.phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{item ? 'Edit Supplier' : 'Add New Supplier'}</h2>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Supplier Name</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
      <div>
        <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">Contact Person</label>
        <input type="text" name="contact_person" id="contact_person" value={formData.contact_person} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
       <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
       <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
        <button type="submit" className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">{item ? 'Update' : 'Save'}</button>
      </div>
    </form>
  );
};

// --- Main Supplier Management Page ---
function SettingsSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      setSuppliers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSave = async (formData) => {
    try {
      let response;
      if (editingItem) {
        response = await supabase.from('suppliers').update(formData).eq('id', editingItem.id);
      } else {
        response = await supabase.from('suppliers').insert([formData]);
      }
      if (response.error) throw response.error;
      fetchSuppliers();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      setError(`Error saving supplier: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        fetchSuppliers();
      } catch (err) {
        setError(`Error deleting supplier: ${err.message}`);
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
           <Link to="/settings" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Settings</Link>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-lg text-gray-600 mt-1">Manage your vendors and suppliers.</p>
        </div>
        
        <div className="text-right mb-4">
            <button onClick={openAddModal} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                + Add Supplier
            </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Contact Person</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-10">Loading suppliers...</td></tr>
                ) : suppliers.length > 0 ? (
                  suppliers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{item.name}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{item.contact_person}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{item.email}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{item.phone}</p></td>
                      <td className="px-5 py-4 text-sm text-center space-x-3">
                        <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-500">No suppliers found. Add one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <SupplierForm 
          onSave={handleSave} 
          onCancel={() => setIsModalOpen(false)} 
          item={editingItem} 
        />
      </Modal>
    </div>
  );
}

export default SettingsSuppliersPage;
