// FILE: src/components/AssignQuestionnaireModal.jsx (New File)
// This is the modal for assigning a questionnaire template to a client.

import React, { useState, useEffect } from 'react';

function AssignQuestionnaireModal({ isOpen, onClose, onQuestionnaireAssigned, clientData }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.from('questionnaire_templates').select('*');
          if (error) throw error;
          setTemplates(data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
      setSelectedTemplateId('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      setError('Please select a questionnaire template.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from('client_questionnaires').insert([{
        contact_id: clientData.id,
        template_id: selectedTemplateId,
        status: 'Not Started',
      }]);
      if (error) throw error;
      onQuestionnaireAssigned();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Assign Questionnaire</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Questionnaire Template</label>
              <select 
                value={selectedTemplateId} 
                onChange={(e) => setSelectedTemplateId(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">-- Select a Template --</option>
                {loading ? <option>Loading...</option> : templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Assign Questionnaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignQuestionnaireModal;