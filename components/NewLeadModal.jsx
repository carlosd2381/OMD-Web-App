import React, { useState } from 'react';
import { supabaseClient } from '../utils/supabaseClient';
import { X } from '../utils/icons';

export default function NewLeadModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        lead_source: 'Website',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const { error: insertError } = await supabaseClient
            .from('contacts')
            .insert([{
                ...formData,
                status: 'Lead',
                pipeline_stage: 'New Lead',
                price_tier: 'Public/Direct'
            }]);

        if (insertError) {
            setError(insertError.message);
            console.error("Error creating lead:", insertError);
        } else {
            onSuccess();
            onClose();
        }
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Create New Lead</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"/>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"/>
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"/>
                    </div>
                     <div>
                        <label htmlFor="lead_source" className="block text-sm font-medium text-gray-700">Lead Source</label>
                        <select name="lead_source" id="lead_source" value={formData.lead_source} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500">
                            <option>Website</option>
                            <option>Instagram</option>
                            <option>Facebook</option>
                            <option>Referral</option>
                            <option>Walk-in</option>
                            <option>Other</option>
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-yellow-400 text-gray-900 font-bold rounded-md hover:bg-yellow-500 disabled:bg-gray-300">
                            {isSubmitting ? 'Saving...' : 'Save Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}