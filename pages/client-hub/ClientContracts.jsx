import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AddContractModal from '../../components/AddContractModal';

function ClientContracts() {
  const { clientData } = useOutletContext();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddContractModalOpen, setIsAddContractModalOpen] = useState(false);

  const fetchContracts = async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('contracts').select('*, quotes(id)').eq('contact_id', clientData.id).order('created_at', { ascending: false });
      if (error) throw error;
      setContracts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [clientData]);

  const handleSendContract = async (contractId) => {
    try {
      await supabase.from('contracts').update({ status: 'Sent', sent_at: new Date().toISOString() }).eq('id', contractId);
      fetchContracts();
    } catch (error) {
      setError(`Error sending contract: ${error.message}`);
    }
  };

  if (loading) return <div>Loading contracts...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Contracts</h3>
          <button 
            onClick={() => setIsAddContractModalOpen(true)}
            className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition duration-300"
          >
            + New Contract
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"><th className="px-5 py-3">Date Created</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date Sent</th><th className="px-5 py-3">Date Signed</th><th className="px-5 py-3">Actions</th></tr></thead>
            <tbody>
              {contracts.length > 0 ? (
                contracts.map((contract) => (<tr key={contract.id} className="border-b border-gray-200 hover:bg-gray-50"><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(contract.created_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p></td><td className="px-5 py-4 text-sm"><span className="relative inline-block px-3 py-1 font-semibold leading-tight text-blue-900"><span aria-hidden className="absolute inset-0 bg-blue-200 opacity-50 rounded-full"></span><span className="relative">{contract.status}</span></span></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{contract.sent_at ? new Date(contract.sent_at).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'N/A'}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{contract.signed_at ? new Date(contract.signed_at).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'N/A'}</p></td><td className="px-5 py-4 text-sm flex items-center space-x-3"><a href="#" className="text-indigo-600 hover:text-indigo-900">View</a>{contract.status === 'Draft' && (<button onClick={() => handleSendContract(contract.id)} className="text-green-600 hover:text-green-900">Send</button>)}</td></tr>))
              ) : (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No contracts have been created for this client.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AddContractModal isOpen={isAddContractModalOpen} onClose={() => setIsAddContractModalOpen(false)} onContractAdded={fetchContracts} clientData={clientData} />
    </>
  );
}

export default ClientContracts;