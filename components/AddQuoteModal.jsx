import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import ProductPickerModal from './ProductPickerModal';

// Reusable form components
const FormSection = ({ title, children }) => (
  <div className="mt-8">
    <h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
      {children}
    </select>
  </div>
);

// Action buttons for the right sidebar
const ActionButton = ({ children, primary = false, onClick }) => (
  <button onClick={onClick} className={`w-full text-left px-4 py-2 text-sm rounded-md ${
    primary 
      ? 'bg-blue-600 text-white hover:bg-blue-700' 
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  }`}>
    {children}
  </button>
);

function AddQuoteModal({ isOpen, onClose, onQuoteAdded, clientData }) {
  const [menuItems, setMenuItems] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for the quote details
  const [quoteName, setQuoteName] = useState('Unnamed Quote');
  const [message, setMessage] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [taxRate, setTaxRate] = useState(null);

  // State for financial calculations
  const [selectedItems, setSelectedItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // State to control the product picker modal
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setQuoteName('Unnamed Quote');
      setSelectedItems([]);
      setTaxRate(null);
      setError(null);

      const fetchData = async () => {
        setLoading(true);
        try {
          const [menuItemsRes, taxRatesRes] = await Promise.all([
            supabase.from('menu_items').select('*').eq('is_active', true),
            supabase.from('tax_rates').select('*').eq('is_active', true)
          ]);
          if (menuItemsRes.error) throw menuItemsRes.error;
          if (taxRatesRes.error) throw taxRatesRes.error;
          setMenuItems(menuItemsRes.data);
          setTaxRates(taxRatesRes.data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // Recalculate totals whenever selectedItems or the tax rate changes
  useEffect(() => {
    const newSubtotal = selectedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const newTaxAmount = taxRate ? newSubtotal * (taxRate.rate_percentage / 100) : 0;
    const newTotal = newSubtotal + newTaxAmount;
    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
  }, [selectedItems, taxRate]);

  if (!isOpen) return null;

  const handleTaxChange = (e) => {
    const selectedRate = taxRates.find(rate => rate.id === e.target.value);
    setTaxRate(selectedRate);
  };

  const handleAddItemToQuote = (item) => {
    setSelectedItems(prevItems => {
      const existingItem = prevItems.find(i => i.menu_item_id === item.id);
      if (existingItem) {
        return prevItems.map(i => 
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prevItems, { 
          menu_item_id: item.id, 
          name: item.name,
          quantity: 1, 
          unit_price: clientData.price_tier === 'Partner/Vendor' ? item.partner_price : item.public_price,
        }];
      }
    });
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (qty > 0) {
      setSelectedItems(prevItems => 
        prevItems.map(item => 
          item.menu_item_id === itemId ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(prevItems => prevItems.filter(item => item.menu_item_id !== itemId));
  };

  // UPDATE: This function handles the entire save process.
  const handleSaveQuote = async () => {
    if (selectedItems.length === 0) {
      setError("Please add at least one item to the quote.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Insert into the 'quotes' table
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          contact_id: clientData.id,
          status: 'Draft', // Default status for a new quote
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          currency: 'USD', // Assuming USD for now, can be made dynamic
          tax_rate_id: taxRate ? taxRate.id : null,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Step 2: Prepare the items for the 'quote_items' table
      const itemsToInsert = selectedItems.map(item => ({
        quote_id: quoteData.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      // Step 3: Insert all items into the 'quote_items' table
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // Success!
      onQuoteAdded(); // Refresh the list on the previous page
      onClose(); // Close the modal
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">New Quote for {clientData.full_name}</h2>
            <div className="flex space-x-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
              {/* UPDATE: This button now calls the handleSaveQuote function */}
              <button onClick={handleSaveQuote} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side: Main Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                
                <FormSection title="Details">
                  <Input label="Name" value={quoteName} onChange={(e) => setQuoteName(e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="4" className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Expiration" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
                    <Select label="Tax" onChange={handleTaxChange}>
                      <option value="">No Tax</option>
                      {loading ? <option>Loading...</option> : taxRates.map(rate => (
                        <option key={rate.id} value={rate.id}>{rate.rate_name} ({rate.rate_percentage}%)</option>
                      ))}
                    </Select>
                  </div>
                </FormSection>

                <FormSection title="Quote Configuration">
                  <div className="flex justify-end space-x-2">
                      <button onClick={() => setIsProductPickerOpen(true)} className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300">Add Product...</button>
                      <button className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300">Manual Entry</button>
                  </div>
                  <div className="mt-4 border rounded-lg p-4 min-h-[150px]">
                    {selectedItems.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-semibold p-2">Item</th>
                            <th className="text-left font-semibold p-2 w-24">Qty</th>
                            <th className="text-right font-semibold p-2">Price</th>
                            <th className="text-right font-semibold p-2">Total</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItems.map(item => (
                            <tr key={item.menu_item_id} className="border-b">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">
                                <Input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.menu_item_id, e.target.value)} className="w-20 text-center" min="1" />
                              </td>
                              <td className="p-2 text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unit_price)}</td>
                              <td className="p-2 text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.quantity * item.unit_price)}</td>
                              <td className="p-2 text-center">
                                <button onClick={() => handleRemoveItem(item.menu_item_id)} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center text-gray-500">Selected items will appear here.</p>
                    )}
                  </div>
                </FormSection>

                <FormSection title="Booking Process">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Select label="Payment Schedule"><option>Default Schedule</option></Select>
                      <Select label="Contract"><option>Default Contract</option></Select>
                   </div>
                </FormSection>
                
                {/* Display any submission errors */}
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

              </div>
            </div>

            {/* Right Side: Actions & Summary */}
            <aside className="w-72 bg-white p-6 border-l flex flex-col justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg mb-4">Actions</h3>
                <div className="space-y-2">
                  <ActionButton primary>Convert to Advanced Quote</ActionButton>
                  <ActionButton>Email Quote</ActionButton>
                  <ActionButton>Duplicate Quote</ActionButton>
                  <ActionButton>View / Print PDF</ActionButton>
                  <ActionButton>Delete</ActionButton>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span> <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tax ({taxRate ? taxRate.rate_name : 'N/A'}):</span> <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(taxAmount)}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold text-gray-800">Total:</span> <span className="font-bold text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}</span></div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      
      <ProductPickerModal 
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        menuItems={menuItems}
        onAddItem={handleAddItemToQuote}
      />
    </>
  );
}

export default AddQuoteModal;
