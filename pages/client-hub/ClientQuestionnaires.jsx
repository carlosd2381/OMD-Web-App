import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AssignQuestionnaireModal from '../../components/AssignQuestionnaireModal';

function ClientQuestionnaires() {
  const { clientData } = useOutletContext();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchQuestionnaires = async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('client_questionnaires').select(`*, questionnaire_templates ( name )`).eq('contact_id', clientData.id).order('created_at', { ascending: false });
      if (error) throw error;
      setQuestionnaires(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, [clientData]);

  if (loading) return <div>Loading questionnaires...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Questionnaires</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition duration-300"
          >
            + Assign Questionnaire
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"><th className="px-5 py-3">Questionnaire Name</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date Sent</th><th className="px-5 py-3">Date Completed</th><th className="px-5 py-3">Actions</th></tr></thead>
            <tbody>
              {questionnaires.length > 0 ? (
                questionnaires.map((q) => (<tr key={q.id} className="border-b border-gray-200 hover:bg-gray-50"><td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{q.questionnaire_templates.name}</p></td><td className="px-5 py-4 text-sm"><span className="relative inline-block px-3 py-1 font-semibold leading-tight text-yellow-900"><span aria-hidden className="absolute inset-0 bg-yellow-200 opacity-50 rounded-full"></span><span className="relative">{q.status}</span></span></td><td className="px-5 py-4 text-sm"><p className="text-gray-900">{q.sent_at ? new Date(q.sent_at).toLocaleDateString() : 'N/A'}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900">{q.completed_at ? new Date(q.completed_at).toLocaleDateString() : 'N/A'}</p></td><td className="px-5 py-4 text-sm"><a href="#" className="text-indigo-600 hover:text-indigo-900">View/Fill Out</a></td></tr>))
              ) : (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No questionnaires assigned to this client.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AssignQuestionnaireModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onQuestionnaireAssigned={fetchQuestionnaires} clientData={clientData} />
    </>
  );
}

export default ClientQuestionnaires;