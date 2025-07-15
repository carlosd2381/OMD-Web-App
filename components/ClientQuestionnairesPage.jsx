import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Edit } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const isCompleted = status === 'Completed';
  const colorClasses = isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  const icon = isCompleted ? <CheckCircle size={16} /> : <Edit size={16} />;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colorClasses}`}>
      {icon}
      <span className="ml-2">{status}</span>
    </span>
  );
};

function ClientQuestionnairesPage() {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientQuestionnaires = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (contactError || !contact) throw new Error("Could not find your contact information.");

      const { data: questionnaireData, error: qError } = await supabase
        .from('client_questionnaires')
        .select(`
          id,
          status,
          completed_at,
          questionnaire_templates ( name, description )
        `)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false });
      
      if (qError) throw qError;
      setQuestionnaires(questionnaireData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClientQuestionnaires();
  }, [fetchClientQuestionnaires]);

  if (loading) return <div className="p-8">Loading your questionnaires...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Questionnaires</h1>
          <p className="text-lg text-gray-600 mt-1">Please complete the following forms to help us plan your event.</p>
        </div>

        {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Completed On</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questionnaires.length > 0 ? questionnaires.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">
                      <p className="font-semibold">{q.questionnaire_templates.name}</p>
                      <p className="text-xs text-gray-600">{q.questionnaire_templates.description}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {q.completed_at ? new Date(q.completed_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-sm text-center">
                      <Link to={`/portal/questionnaires/${q.id}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-slate-800 hover:bg-slate-700">
                        {q.status === 'Completed' ? 'View Answers' : 'Fill Out'}
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">You have no questionnaires to display.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientQuestionnairesPage;
