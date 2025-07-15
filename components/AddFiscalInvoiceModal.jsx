import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
  </div>
);

const Select = ({ label, children, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
        {children}
      </select>
    </div>
);

function AddFiscalInvoiceModal({ isOpen, onClose, onFiscalInvoiceAdded, eventId }) {
  const [formData, setFormData] = useState({
    date_required: '',
    date_requested: '',
    date_submitted: '',
    currency: 'MXN',
    exchange_rate: '',
    subtotal: '',
    iva: '',
    isr: '',
    iva_ret: '',
    isr_ret: '',
    total: '',
    pdf_link: '',
    xml_link: '',
    folio: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // FIX: Sanitize form data before sending to Supabase.
      // Convert empty strings for numeric fields to null.
      const sanitizedData = { ...formData };
      const numericFields = ['exchange_rate', 'subtotal', 'iva', 'isr', 'iva_ret', 'isr_ret', 'total'];
      numericFields.forEach(field => {
        if (sanitizedData[field] === '') {
          sanitizedData[field] = null;
        }
      });

      const { error } = await supabase.from('fiscal_invoices').insert([{ 
        event_id: eventId,
        ...sanitizedData 
      }]);
      if (error) throw error;
      onFiscalInvoiceAdded();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Add Fiscal Invoice Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Date Required" type="date" name="date_required" value={formData.date_required} onChange={handleChange} />
            <Input label="Date Requested" type="date" name="date_requested" value={formData.date_requested} onChange={handleChange} />
            <Input label="Date Submitted" type="date" name="date_submitted" value={formData.date_submitted} onChange={handleChange} />
            
            <Select label="Currency" name="currency" value={formData.currency} onChange={handleChange}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </Select>
            <Input label="Exchange Rate" type="number" name="exchange_rate" value={formData.exchange_rate} onChange={handleChange} step="0.01" />
            <Input label="Folio" name="folio" value={formData.folio} onChange={handleChange} />

            <Input label="Subtotal" type="number" name="subtotal" value={formData.subtotal} onChange={handleChange} step="0.01" />
            <Input label="IVA" type="number" name="iva" value={formData.iva} onChange={handleChange} step="0.01" />
            <Input label="ISR" type="number" name="isr" value={formData.isr} onChange={handleChange} step="0.01" />
            <Input label="IVA Ret." type="number" name="iva_ret" value={formData.iva_ret} onChange={handleChange} step="0.01" />
            <Input label="ISR Ret." type="number" name="isr_ret" value={formData.isr_ret} onChange={handleChange} step="0.01" />
            <Input label="Total" type="number" name="total" value={formData.total} onChange={handleChange} step="0.01" required />

            <div className="md:col-span-3">
              <Input label="Link to PDF" type="url" name="pdf_link" value={formData.pdf_link} onChange={handleChange} />
            </div>
            <div className="md:col-span-3">
              <Input label="Link to XML" type="url" name="xml_link" value={formData.xml_link} onChange={handleChange} />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFiscalInvoiceModal;