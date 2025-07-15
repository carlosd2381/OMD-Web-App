import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useParams, Link } from 'react-router-dom';

function ClientQuestionnaireDetailPage() {
  const { id } = useParams();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchQuestionnaire = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('client_questionnaires')
        .select(`*, questionnaire_templates(*), contacts(full_name)`)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setQuestionnaire(data);
      setAnswers(data.answers || {});

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestionnaire();
  }, [fetchQuestionnaire]);

  const handleAnswerChange = (questionLabel, value) => {
    setAnswers(prev => ({ ...prev, [questionLabel]: value }));
  };

  const handleSave = async (isFinalSubmission = false) => {
    const status = isFinalSubmission ? 'Completed' : 'In Progress';
    const completed_at = isFinalSubmission ? new Date().toISOString() : questionnaire.completed_at;

    try {
      const { error } = await supabase
        .from('client_questionnaires')
        .update({ answers, status, completed_at })
        .eq('id', id);

      if (error) throw error;
      setSuccessMessage(isFinalSubmission ? 'Thank you for your submission!' : 'Your progress has been saved.');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError(`Error saving: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8">Loading questionnaire...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!questionnaire) return <div className="p-8">Questionnaire not found.</div>;

  const questions = questionnaire.questionnaire_templates?.questions || [];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
            <Link to="/portal/questionnaires" className="text-sm text-indigo-600 hover:underline">&larr; Back to All Questionnaires</Link>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg border">
          <h1 className="text-3xl font-bold text-gray-900">{questionnaire.questionnaire_templates.name}</h1>
          <p className="text-lg text-gray-600 mt-1">{questionnaire.questionnaire_templates.description}</p>
          <p className="text-sm text-gray-500 mt-2">For: {questionnaire.contacts.full_name}</p>
          <hr className="my-6" />

          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={index}>
                <label className="block text-md font-semibold text-gray-800 mb-2">{q.label}</label>
                {q.type === 'textarea' ? (
                  <textarea
                    value={answers[q.label] || ''}
                    onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <input
                    type={q.type}
                    value={answers[q.label] || ''}
                    onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <div>
                {successMessage && <p className="text-green-600 font-semibold">{successMessage}</p>}
            </div>
            <div className="space-x-4">
              <button onClick={() => handleSave(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Save Progress</button>
              <button onClick={() => handleSave(true)} className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700">Submit Final Answers</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientQuestionnaireDetailPage;
