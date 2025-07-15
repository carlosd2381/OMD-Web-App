import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { UserCheck, UserX, Mail, Phone, Building } from 'lucide-react';

const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
        <div className="mr-4 text-gray-500">{icon}</div>
        <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    </div>
);

function ClientOverview() {
    const { clientData, onReload } = useOutletContext();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleCreatePortalAccess = async () => {
        if (!window.confirm(`This will create a portal login for ${clientData.email} and send them an email with a login link. Are you sure?`)) {
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { data, error } = await supabase.functions.invoke('create-portal-user', {
                body: { 
                    contactId: clientData.id, 
                    email: clientData.email 
                },
            });

            if (error) throw error;
            
            setMessage(data.message || "Portal access created successfully!");
            onReload(); // This function should be passed from ClientHub to refetch data
        } catch (err) {
            const errorMessage = err.message || "An unknown error occurred.";
            setError(`Failed to create portal access: ${errorMessage}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Contact Details Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoCard icon={<Mail size={24} />} label="Email" value={clientData.email} />
                    <InfoCard icon={<Phone size={24} />} label="Phone" value={clientData.phone} />
                    <InfoCard icon={<Building size={24} />} label="Company" value={clientData.company_name} />
                </div>
            </div>

            {/* Portal Access Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Client Portal Access</h3>
                {message && <div className="p-3 bg-green-100 text-green-800 rounded-md mb-4">{message}</div>}
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">{error}</div>}

                {clientData.auth_user_id ? (
                    <div className="flex items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <UserCheck size={24} className="text-green-600 mr-4" />
                        <div>
                            <p className="font-semibold text-green-800">Portal Access Enabled</p>
                            <p className="text-sm text-green-700">This client can log in to the portal.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-center">
                            <UserX size={24} className="text-yellow-600 mr-4" />
                            <div>
                                <p className="font-semibold text-yellow-800">Portal Access Not Enabled</p>
                                <p className="text-sm text-yellow-700">This client cannot log in to the portal yet.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCreatePortalAccess}
                            disabled={loading}
                            className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Portal Access'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClientOverview;
