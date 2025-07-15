import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

// --- Reusable Components for the Report ---

const FilterBar = ({ children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-8 border border-gray-200">
    <div className="flex flex-wrap items-center gap-4">
      {children}
    </div>
  </div>
);

// --- Main Supplier History Report Component ---

function SupplierHistoryReport() {
  const [filters, setFilters] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1); // Default to last year
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      supplier_id: '',
    };
  });

  const [suppliers, setSuppliers] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all suppliers for the dropdown selector
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase.from('suppliers').select('id, name').order('name');
      if (error) {
        console.error("Error fetching suppliers:", error);
      } else {
        setSuppliers(data);
      }
    };
    fetchSuppliers();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const formatCurrency = (amount, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

  const generateReport = useCallback(async () => {
    if (!filters.supplier_id) {
        alert("Please select a supplier to generate a report.");
        return;
    }
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('purchase_orders')
        .select(`*, purchase_order_items(*, ingredients(name))`)
        .eq('supplier_id', filters.supplier_id);

      if (filters.startDate) query = query.gte('order_date', filters.startDate);
      if (filters.endDate) query = query.lte('order_date', filters.endDate);
      
      const { data, error } = await query.order('order_date', { ascending: false });

      if (error) throw error;
      
      setReportData(data || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Supplier History Report</h1>
          <p className="text-lg text-gray-600 mt-1">Review purchase order history for a specific supplier.</p>
        </div>

        <FilterBar>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select name="supplier_id" id="supplier_id" value={filters.supplier_id} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">Select a supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="self-end">
             <button onClick={generateReport} disabled={loading} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 disabled:opacity-50 h-full">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </FilterBar>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}
        
        <div className="space-y-6">
            {loading ? (
                <p className="text-center p-10">Loading report...</p>
            ) : reportData.length > 0 ? (
                reportData.map(po => (
                    <div key={po.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                        <div className="border-b pb-3 mb-3 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Order Date: {new Date(po.order_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</h3>
                                <p className="text-sm text-gray-600">Status: {po.status}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Total Cost</p>
                                <p className="text-xl font-bold text-gray-800">{formatCurrency(po.total_cost)}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="text-left text-xs font-semibold text-gray-600 uppercase">
                                    <tr>
                                        <th className="py-2">Ingredient</th>
                                        <th className="py-2 text-right">Quantity</th>
                                        <th className="py-2 text-right">Unit Cost</th>
                                        <th className="py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.purchase_order_items.map((item, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="py-2 text-sm font-medium text-gray-900">{item.ingredients.name}</td>
                                            <td className="py-2 text-sm text-gray-700 text-right">{item.quantity}</td>
                                            <td className="py-2 text-sm text-gray-700 text-right">{formatCurrency(item.unit_cost)}</td>
                                            <td className="py-2 text-sm text-gray-700 text-right">{formatCurrency(item.quantity * item.unit_cost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md border">
                    <p className="text-gray-500">No purchase orders found for this supplier in the selected period.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default SupplierHistoryReport;
