import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddMenuItemModal from './AddMenuItemModal';
import EditMenuItemModal from './EditMenuItemModal';

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setMenuItems(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item? This may affect existing quotes.')) {
      try {
        const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
        if (error) throw error;
        fetchMenuItems();
      } catch (error) {
        setError(`Error deleting item: ${error.message}`);
      }
    }
  };

  if (loading) return <div>Loading menu...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Menu & Pricing</h3>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--color-brand-brown)] text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition duration-300">
          + Add New Item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3 text-right">Item Cost</th>
              <th className="px-5 py-3 text-right">Public Price</th>
              <th className="px-5 py-3 text-right">Partner Price</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap font-semibold">{item.name}</p></td>
                <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{item.category}</p></td>
                <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.item_cost)}</p></td>
                <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.public_price)}</p></td>
                <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.partner_price)}</p></td>
                <td className="px-5 py-4 text-sm text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm flex items-center space-x-3">
                  <button onClick={() => handleEdit(item)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddMenuItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onItemAdded={fetchMenuItems} />
      <EditMenuItemModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onItemUpdated={fetchMenuItems} editingItem={editingItem} />
    </div>
  );
}

export default MenuManagement;
