import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

// --- Main Purchase Order Detail Page ---
function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [formData, setFormData] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newItem, setNewItem] = useState({ ingredient_id: '', quantity: '', unit_cost: '' });

  const fetchPOData = useCallback(async () => {
    // FIX: Add a guard clause to prevent the function from running
    // until the ID from the URL is available.
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: supplierData, error: supplierError } = await supabase.from('suppliers').select('*').order('name');
      if (supplierError) throw supplierError;
      setSuppliers(supplierData);

      if (isNew) {
        setFormData({
          supplier_id: '',
          order_date: new Date().toISOString().split('T')[0],
          status: 'Draft'
        });
        setLoading(false);
      } else {
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .select('*, suppliers(*)')
          .eq('id', id)
          .single();
        if (poError) throw poError;
        setFormData(poData);

        const { data: itemsData, error: itemsError } = await supabase
          .from('purchase_order_items')
          .select('*, ingredients(name, unit_of_measure)')
          .eq('purchase_order_id', id);
        if (itemsError) throw itemsError;
        setPoItems(itemsData);

        const { data: ingredientData, error: ingredientError } = await supabase.from('ingredients').select('*').order('name');
        if (ingredientError) throw ingredientError;
        setIngredients(ingredientData);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchPOData();
  }, [fetchPOData]);
  
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePOHeader = async () => {
    if (!formData.supplier_id) {
      alert("Please select a supplier.");
      return;
    }
    
    try {
      if (isNew) {
        const { data, error } = await supabase
            .from('purchase_orders')
            .insert(formData)
            .select()
            .single();
        if (error) throw error;
        navigate(`/purchasing/${data.id}`);
      } else {
        const { suppliers, ...updateData } = formData;
        const { error } = await supabase
            .from('purchase_orders')
            .update(updateData)
            .eq('id', id);
        if (error) throw error;
        alert("PO Header updated!");
      }
    } catch(err) {
      setError(err.message);
    }
  };

  const handleAddPOItem = async (e) => {
    e.preventDefault();
    if (!newItem.ingredient_id || !newItem.quantity || !newItem.unit_cost) {
        alert("Please fill out all fields for the new item.");
        return;
    }
    try {
        const { error } = await supabase
            .from('purchase_order_items')
            .insert({
                purchase_order_id: id,
                ingredient_id: newItem.ingredient_id,
                quantity: newItem.quantity,
                unit_cost: newItem.unit_cost
            });
        if (error) throw error;
        setNewItem({ ingredient_id: '', quantity: '', unit_cost: '' });
        fetchPOData();
    } catch(err) {
        setError(err.message);
    }
  };
  
  const handleDeletePOItem = async (itemId) => {
      if (window.confirm("Are you sure?")) {
          try {
              const { error } = await supabase.from('purchase_order_items').delete().eq('id', itemId);
              if (error) throw error;
              fetchPOData();
          } catch(err) {
              setError(err.message);
          }
      }
  };
  
  useEffect(() => {
    if (poItems.length > 0 && !isNew && formData) {
        const total = poItems.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);
        if (formData.total_cost !== total) {
            supabase.from('purchase_orders').update({ total_cost: total }).eq('id', id).then(({error}) => {
                if(error) console.error("Error updating total cost:", error);
            });
            setFormData(prev => ({...prev, total_cost: total}));
        }
    }
  }, [poItems, id, isNew, formData]);


  if (loading || !formData) return <div>Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <Link to="/purchasing" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Purchase Orders</Link>
          <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'New Purchase Order' : `Purchase Order Details`}</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Header</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                {isNew ? (
                    <select name="supplier_id" value={formData.supplier_id} onChange={handleHeaderChange} className="mt-1 block w-full p-2 border rounded-md">
                        <option value="">Select a supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                ) : (
                    <p className="mt-1 font-semibold p-2">{formData?.suppliers?.name}</p>
                )}
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <input type="date" name="order_date" value={formData?.order_date || ''} onChange={handleHeaderChange} className="mt-1 block w-full p-2 border rounded-md" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" value={formData?.status || 'Draft'} onChange={handleHeaderChange} className="mt-1 block w-full p-2 border rounded-md">
                    <option>Draft</option>
                    <option>Ordered</option>
                    <option>Received</option>
                </select>
             </div>
          </div>
           <div className="text-right mt-4">
                <button onClick={handleSavePOHeader} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">
                    {isNew ? 'Create Purchase Order' : 'Save Changes'}
                </button>
            </div>
        </div>

        {!isNew && (
            <div className="bg-white p-6 rounded-lg shadow-lg border">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Line Items</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                                <th className="py-2">Ingredient</th>
                                <th className="py-2 text-right">Quantity</th>
                                <th className="py-2 text-right">Unit Cost</th>
                                <th className="py-2 text-right">Total</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {poItems.map(item => (
                                <tr key={item.id} className="border-t">
                                    <td className="py-2">{item.ingredients.name}</td>
                                    <td className="py-2 text-right">{item.quantity} {item.ingredients.unit_of_measure}</td>
                                    <td className="py-2 text-right">${item.unit_cost.toFixed(2)}</td>
                                    <td className="py-2 text-right">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                                    <td className="py-2 text-center"><button onClick={() => handleDeletePOItem(item.id)} className="text-red-500">&times;</button></td>
                                </tr>
                            ))}
                            <tr className="border-t bg-gray-50">
                                <td className="p-2">
                                    <select name="ingredient_id" value={newItem.ingredient_id} onChange={handleNewItemChange} className="w-full p-1 border rounded">
                                        <option value="">Select Ingredient</option>
                                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                </td>
                                <td className="p-2"><input type="number" name="quantity" value={newItem.quantity} onChange={handleNewItemChange} className="w-full p-1 border rounded text-right" placeholder="Qty" /></td>
                                <td className="p-2"><input type="number" step="0.01" name="unit_cost" value={newItem.unit_cost} onChange={handleNewItemChange} className="w-full p-1 border rounded text-right" placeholder="Cost" /></td>
                                <td></td>
                                <td className="p-2 text-center"><button onClick={handleAddPOItem} className="bg-blue-600 text-white px-3 py-1 rounded">Add</button></td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 font-bold">
                                <td colSpan="3" className="text-right py-2">Total:</td>
                                <td className="text-right py-2">${formData?.total_cost?.toFixed(2) || '0.00'}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseOrderDetailPage;
