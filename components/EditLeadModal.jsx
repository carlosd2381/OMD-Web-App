import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// Reusable form components
const FormSection = ({ title, children }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold text-slate-800 border-b border-gray-200 pb-2 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

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

const servicesList = [
  'Churros', 'Churros w/Toppings', 'Churros Filled', 'Churros & Ice Cream', 'Pancakes', 'Pancakes w/Fruit', 'Pancakes & Ice Cream', 'Waffles', 'Waffles w/ Fruit', 'Waffles & Ice Cream', 'Crepes', 'Crepes w/Fruit', 'Crepes & Ice Cream', 'Ice Cream', 'Sorbet', 'Conchas', 'Conchas & Ice Cream', 'Rollz', 'Rollz w/Fruit', 'Rollz Signature', 'Cannolis', 'S’mores Bar'
];

function EditLeadModal({ isOpen, onClose, onLeadUpdated, editingLead }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // UPDATE: This useEffect now re-fetches the complete contact data when the modal opens.
  // This ensures all fields are populated correctly, even if the data passed from the list was incomplete.
  useEffect(() => {
    if (isOpen && editingLead?.id) {
      setLoading(true);
      const fetchFullContactData = async () => {
        try {
          const { data, error } = await supabase
            .from('contacts')
            .select('*, events(*)')
            .eq('id', editingLead.id)
            .single();
          
          if (error) throw error;

          const event = data.events && data.events.length > 0 ? data.events[0] : {};
          setFormData({ ...data, ...event }); // Combine contact and event data into one state object
          
        } catch (err) {
          setError("Failed to load contact details.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchFullContactData();
    }
  }, [isOpen, editingLead]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const services = checked
        ? [...(prev.services_requested || []), value]
        : (prev.services_requested || []).filter(service => service !== value);
      return { ...prev, services_requested: services };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const event = editingLead.events && editingLead.events.length > 0 ? editingLead.events[0] : null;
      
      // Update the contacts table
      await supabase.from('contacts').update({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        price_tier: formData.price_tier,
        lead_source: formData.lead_source,
        inquiry_date: formData.inquiry_date,
      }).eq('id', editingLead.id);

      // Prepare event data, ensuring null for empty strings
      const eventData = {
        event_date: formData.event_date || null,
        guest_count: formData.guest_count || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        venue_name: formData.venue_name || null,
        venue_address: formData.venue_address || null,
        services_requested: formData.services_requested || [],
      };

      // Update or insert into the events table
      if (event && event.id) {
        await supabase.from('events').update(eventData).eq('id', event.id);
      } else if (formData.event_date) {
        await supabase.from('events').insert({ ...eventData, contact_id: editingLead.id });
      }

      onLeadUpdated();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto py-10">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Contact</h2>
        {loading ? (
          <p>Loading details...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormSection title="Lead Information">
              <Input label="Lead 1st Contact (Date)" type="date" name="inquiry_date" value={formData.inquiry_date || ''} onChange={handleChange} />
              <Select label="Lead Source" name="lead_source" value={formData.lead_source || 'Website'} onChange={handleChange}>
                {['Website', 'Facebook', 'Facebook Group', 'Instagram', 'TikTok', 'Planner', 'Hotel', 'Hotel Preferred Vendor', 'Venue', 'Vendor Referral', 'Client Referral', 'Other'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
              <Select label="Price List" name="price_tier" value={formData.price_tier || 'Public/Direct'} onChange={handleChange}>
                <option value="Public/Direct">Public/Direct</option>
                <option value="Partner/Vendor">Partner/Vendor</option>
              </Select>
            </FormSection>

            <FormSection title="Event Details">
              <Input label="Event Date" type="date" name="event_date" value={formData.event_date || ''} onChange={handleChange} />
              <Input label="Est. PAX" type="number" name="guest_count" value={formData.guest_count || ''} onChange={handleChange} />
              <Input label="Start Time" type="time" name="start_time" value={formData.start_time || ''} onChange={handleChange} />
              <Input label="End Time" type="time" name="end_time" value={formData.end_time || ''} onChange={handleChange} />
            </FormSection>

            <FormSection title="Client Information">
              <Input label="Client Name" type="text" name="full_name" value={formData.full_name || ''} onChange={handleChange} required />
              <Input label="Client Phone #" type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} />
              <Input label="Client E-Mail" type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
            </FormSection>

            <FormSection title="Venue Information">
               <Input label="Venue" type="text" name="venue_name" value={formData.venue_name || ''} onChange={handleChange} />
               <Input label="Location" type="text" name="venue_address" value={formData.venue_address || ''} onChange={handleChange} />
            </FormSection>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-gray-200 pb-2 mb-4">Services Requested</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {servicesList.map(service => (
                  <label key={service} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      value={service} 
                      checked={formData.services_requested?.includes(service)}
                      onChange={handleCheckboxChange} 
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditLeadModal;
