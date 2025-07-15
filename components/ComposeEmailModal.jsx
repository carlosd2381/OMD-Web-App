import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// Mock templates for demonstration
const mockTemplates = [
  { id: 't1', name: 'Initial Inquiry Follow-up', subject: 'Following up on your dessert inquiry!', body: 'Hello {client_name},\n\nThank you for your recent inquiry. We would love to learn more about your event.\n\nBest,\nThe Oh My Desserts! Team' },
  { id: 't2', name: 'Quote Ready', subject: 'Your Quote from Oh My Desserts! is Ready', body: 'Hello {client_name},\n\nYour personalized quote is ready for your review. Please find it attached.\n\nBest,\nThe Oh My Desserts! Team' },
];

function ComposeEmailModal({ isOpen, onClose, onEmailSent, clientData }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setBody('');
      setTemplateId('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTemplateChange = (e) => {
    const selectedTemplateId = e.target.value;
    setTemplateId(selectedTemplateId);
    const template = mockTemplates.find(t => t.id === selectedTemplateId);
    if (template) {
      // Replace placeholder with actual client name
      setSubject(template.subject);
      setBody(template.body.replace('{client_name}', clientData.full_name));
    } else {
      setSubject('');
      setBody('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from('email_logs').insert([{
        contact_id: clientData.id,
        subject: subject,
        // In a real app, the body would be stored, maybe as HTML
        status: 'Sent',
        template_name: mockTemplates.find(t => t.id === templateId)?.name || 'Custom Email',
        // sent_by_user_id would be added once you have user auth
      }]);

      if (error) throw error;
      
      onEmailSent(); // Refresh the log on the previous page
      onClose(); // Close the modal
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Compose Email to {clientData.full_name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Template (Optional)</label>
              <select value={templateId} onChange={handleTemplateChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">-- Select a Template --</option>
                {mockTemplates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
              <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
            </div>
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">Body</label>
              <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows="10" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required></textarea>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Log Sent Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComposeEmailModal;
