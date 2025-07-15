import React, { useState } from 'react';

function ProductPickerModal({ isOpen, onClose, menuItems, onAddItem }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (item) => {
    onAddItem(item);
    // Optional: close the modal after adding an item
    // onClose(); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[70vh]">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Select a Product</h3>
          <Input 
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.public_price)}</p>
                  </div>
                  <button 
                    onClick={() => handleAddItem(item)}
                    className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                  >
                    + Add to Quote
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No products found.</p>
            )}
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// A simple Input component for use inside the modal
const Input = (props) => (
  <input {...props} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
);

export default ProductPickerModal;
