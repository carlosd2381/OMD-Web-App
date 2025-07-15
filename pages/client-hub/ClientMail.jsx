import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import ComposeEmailModal from '../../components/ComposeEmailModal';

function ClientMail() {
  const { clientData } = useOutletContext();
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  const fetchEmailLogs = async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('email_logs').select('*').eq('contact_id', clientData.id).order('sent_at', { ascending: false });
      if (error) throw error;
      setEmailLogs(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [clientData]);

  if (loading) return <div>Loading email history...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Mail Log</h3>
          <button 
            onClick={() => setIsComposeModalOpen(true)}
            className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition duration-300"
          >
            + Compose Email
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"><th className="px-5 py-3">Date Sent</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Template</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
            <tbody>
              {emailLogs.length > 0 ? (
                emailLogs.map((log) => (<tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50"><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(log.sent_at).toLocaleString()}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap font-semibold">{log.subject}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{log.template_name || 'N/A'}</p></td><td className="px-5 py-4 text-sm"><span className="relative inline-block px-3 py-1 font-semibold leading-tight text-blue-900"><span aria-hidden className="absolute inset-0 bg-blue-200 opacity-50 rounded-full"></span><span className="relative">{log.status || 'Sent'}</span></span></td><td className="px-5 py-4 text-sm"><a href="#" className="text-indigo-600 hover:text-indigo-900">View</a></td></tr>))
              ) : (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No emails have been logged for this client.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ComposeEmailModal isOpen={isComposeModalOpen} onClose={() => setIsComposeModalOpen(false)} onEmailSent={fetchEmailLogs} clientData={clientData} />
    </>
  );
}

export default ClientMail;