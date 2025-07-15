// FILE: src/components/settings/EditQuestionnaireTemplateModal.jsx (New File)
// This is the modal for editing an existing questionnaire template.

import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const Input = ({ ...props }) => <input {...props} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />;
const Select = ({ ...props }) => <select {...props} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />;

function EditQuestionnaireTemplateModal({ isOpen, onClose, onTemplateUpdated, editingTemplate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate the form when a template is selected for editing
  useEffect(() => {
    if (isOpen && editingTemplate) {
      setName(editingTemplate.name || '');
      setDescription(editingTemplate.description || '');
      setQuestions(editingTemplate.questions || [{ label: '', type: 'Text' }]);
      setError(null);
    }
  }, [isOpen, editingTemplate]);

  if (!isOpen) return null;

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { label: '', type: 'Text' }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('questionnaire_templates')
        .update({
          name,
          description,
          questions,
        })
        .eq('id', editingTemplate.id);
      
      if (error) throw error;
      onTemplateUpdated();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-[var(--color-brand-brown)] mb-6">Edit Questionnaire Template</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input placeholder="Template Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="block w-full p-2 border border-gray-300 rounded-md"></textarea>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Questions</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {questions.map((q, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input placeholder={`Question ${index + 1}`} value={q.label} onChange={(e) => handleQuestionChange(index, 'label', e.target.value)} className="flex-grow" />
                  <Select value={q.type} onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}>
                    <option>Text</option>
                    <option>Textarea</option>
                    <option>Checkbox</option>
                    <option>Date</option>
                  </Select>
                  <button type="button" onClick={() => removeQuestion(index)} className="text-red-500 font-bold text-xl p-1">&times;</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addQuestion} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add Question</button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[var(--color-brand-brown)] text-white font-semibold rounded-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditQuestionnaireTemplateModal;