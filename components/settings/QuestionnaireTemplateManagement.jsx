// FILE: src/components/settings/QuestionnaireTemplateManagement.jsx (Updated)
// This component now handles the logic for Add, Edit, and Delete.

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddQuestionnaireTemplateModal from './AddQuestionnaireTemplateModal';
// UPDATE: Import the new Edit modal
import EditQuestionnaireTemplateModal from './EditQuestionnaireTemplateModal';

function QuestionnaireTemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // UPDATE: Add state for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('questionnaire_templates').select('*').order('name');
      if (error) throw error;
      setTemplates(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // UPDATE: Add handler functions for Edit and Delete
  const handleEdit = (template) => {
    setEditingTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const { error } = await supabase.from('questionnaire_templates').delete().eq('id', templateId);
        if (error) throw error;
        fetchTemplates();
      } catch (error) {
        setError(`Error deleting template: ${error.message}`);
      }
    }
  };

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Questionnaire Templates</h3>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--color-brand-brown)] text-white font-bold py-2 px-4 rounded-lg shadow-md">
          + New Template
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Template Name</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3"># of Questions</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-b hover:bg-gray-50">
                <td className="px-5 py-4 text-sm font-semibold">{template.name}</td>
                <td className="px-5 py-4 text-sm">{template.description}</td>
                <td className="px-5 py-4 text-sm">{template.questions?.length || 0}</td>
                {/* UPDATE: Add functional Edit and Delete buttons */}
                <td className="px-5 py-4 text-sm flex items-center space-x-3">
                  <button onClick={() => handleEdit(template)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                  <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddQuestionnaireTemplateModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTemplateAdded={fetchTemplates}
      />
      {/* UPDATE: Render the new Edit modal */}
      <EditQuestionnaireTemplateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTemplateUpdated={fetchTemplates}
        editingTemplate={editingTemplate}
      />
    </div>
  );
}

export default QuestionnaireTemplateManagement;