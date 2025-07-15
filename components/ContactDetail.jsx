import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../utils/supabaseClient';
import { ArrowLeft } from '../utils/icons';

export default function ContactDetail({ contactId, onBack }) {
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        const fetchContact = async () => {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('contacts')
                .select('*')
                .eq('id', contactId)
                .single();
            
            if (error) {
                console.error('Error fetching contact details:', error);
            } else {
                setContact(data);
            }
            setLoading(false);
        };
        fetchContact();
    }, [contactId]);

    if (loading) {
        return <div className="flex justify-center p-8"><div className="loader"></div></div>;
    }

    if (!contact) {
        return <p>Contact not found.</p>;
    }

    const tabs = ['Overview', 'Quotes & Orders', 'Financials', 'Mail', 'Contracts', 'Questionnaires', 'Tasks', 'Notes', 'Files'];

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft size={20} />
                Back to All Contacts
            </button>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{contact.full_name}</h1>
            <p className="text-lg text-gray-500 mb-6">{contact.email}</p>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                ? 'border-yellow-500 text-yellow-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'Overview' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Lead Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><p className="text-sm text-gray-500">Lead Source</p><p>{contact.lead_source}</p></div>
                            <div><p className="text-sm text-gray-500">Inquiry Date</p><p>{new Date(contact.inquiry_date).toLocaleDateString()}</p></div>
                            <div><p className="text-sm text-gray-500">Status</p><p>{contact.status}</p></div>
                            <div><p className="text-sm text-gray-500">Pipeline Stage</p><p>{contact.pipeline_stage}</p></div>
                        </div>
                    </div>
                )}
                {/* Placeholder for other tabs */}
                {activeTab !== 'Overview' && <p className="p-6 bg-white rounded-lg shadow">{activeTab} content will go here.</p>}
            </div>
        </div>
    );
}