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

// --- Main Inventory Needs Report Component ---

function InventoryNeedsReport() {
  const [filters, setFilters] = useState(() => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // Default to the next 7 days
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Find all 'Accepted' quotes for events within the date range
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('quotes!inner(id)')
        .gte('event_date', filters.startDate)
        .lte('event_date', filters.endDate);

      if (eventsError) throw eventsError;

      const quoteIds = events.map(event => event.quotes.id).filter(id => id);

      if (quoteIds.length === 0) {
        setReportData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch all quote items from those accepted quotes
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('quantity, menu_item_id')
        .in('quote_id', quoteIds);
      
      if (itemsError) throw itemsError;

      // 3. Fetch all recipes (menu_item_ingredients)
      const { data: recipes, error: recipesError } = await supabase
        .from('menu_item_ingredients')
        .select('*');
      if (recipesError) throw recipesError;

      // 4. Fetch all ingredients to get their current stock levels and details
      const { data: allIngredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*');
      if(ingredientsError) throw ingredientsError;
      const ingredientsMap = allIngredients.reduce((acc, ing) => {
        acc[ing.id] = ing;
        return acc;
      }, {});

      // 5. Calculate total required quantity for each ingredient
      const requiredQuantities = {};
      quoteItems.forEach(item => {
        const itemRecipes = recipes.filter(r => r.menu_item_id === item.menu_item_id);
        itemRecipes.forEach(recipePart => {
          const totalNeeded = recipePart.quantity_needed * item.quantity;
          requiredQuantities[recipePart.ingredient_id] = (requiredQuantities[recipePart.ingredient_id] || 0) + totalNeeded;
        });
      });

      // 6. Build the final report data
      const finalReport = Object.entries(requiredQuantities).map(([ingredientId, requiredQty]) => {
        const ingredient = ingredientsMap[ingredientId];
        const inStock = ingredient?.current_stock_level || 0;
        const toOrder = Math.max(0, requiredQty - inStock);
        return {
          id: ingredientId,
          name: ingredient?.name || 'Unknown Ingredient',
          unit: ingredient?.unit_of_measure || 'units',
          required: requiredQty,
          inStock: inStock,
          toOrder: toOrder,
        };
      }).sort((a,b) => b.toOrder - a.toOrder);

      setReportData(finalReport);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/reports" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Reports</Link>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Needs Report</h1>
          <p className="text-lg text-gray-600 mt-1">Forecast ingredient needs based on upcoming events.</p>
        </div>

        <FilterBar>
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
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Ingredient Forecast</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Ingredient</th>
                  <th className="px-5 py-3 text-right">Total Required</th>
                  <th className="px-5 py-3 text-right">Currently In Stock</th>
                  <th className="px-5 py-3 text-right">To Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10">Calculating needs...</td></tr>
                ) : reportData.length > 0 ? (
                  reportData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{item.name}</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{item.required.toFixed(2)} {item.unit}</p></td>
                      <td className="px-5 py-4 text-sm text-right"><p className="text-gray-900">{item.inStock.toFixed(2)} {item.unit}</p></td>
                      <td className="px-5 py-4 text-sm text-right">
                        <span className={`font-semibold px-3 py-1 rounded-full ${item.toOrder > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {item.toOrder.toFixed(2)} {item.unit}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-10 text-gray-500">No upcoming events or recipes found for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryNeedsReport;
