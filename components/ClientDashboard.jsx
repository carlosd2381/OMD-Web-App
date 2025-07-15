import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext
import { Link } from 'react-router-dom';
import { Calendar, FileText, FileQuestion } from 'lucide-react';

const InfoCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-full mr-4">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
                <p className="text-xl font-bold text-gray-800">{value || 'N/A'}</p>
            </div>
        </div>
    </div>
);

function ClientDashboard() {
    const { user } = useAuth(); // Get the logged-in user from context
    const [contactData, setContactData] = useState(null);
    const [upcomingEvent, setUpcomingEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClientData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Find the contact record associated with the logged-in auth user
            const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .select('*')
                .eq('auth_user_id', user.id)
                .single();

            if (contactError) throw new Error("Could not find your contact information.");
            setContactData(contact);

            // 2. Find the next upcoming event for this contact
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('contact_id', contact.id)
                .gte('event_date', new Date().toISOString())
                .order('event_date', { ascending: true })
                .limit(1)
                .single();
            
            // eventError is not thrown if no event is found, it just returns null data
            if (eventError && eventError.code !== 'PGRST116') {
                 throw eventError;
            }
            setUpcomingEvent(eventData);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    if (loading) {
        return <div className="p-8">Loading your dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome, {contactData?.full_name}!</h1>
                    <p className="text-lg text-gray-600 mt-1">Here's a summary of your upcoming event with us.</p>
                </div>

                {upcomingEvent ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <InfoCard title="Event Name" value={upcomingEvent.event_name} icon={<Calendar className="text-blue-500" />} />
                        <InfoCard title="Event Date" value={new Date(upcomingEvent.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} icon={<Calendar className="text-green-500" />} />
                        <InfoCard title="Venue" value={upcomingEvent.venue_name} icon={<Calendar className="text-purple-500" />} />
                    </div>
                ) : (
                    <div className="text-center p-10 bg-white rounded-lg shadow-md border">
                        <p className="text-gray-600">You have no upcoming events scheduled.</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link to="/portal/quotes" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <FileText className="w-8 h-8 text-indigo-500 mb-2" />
                        <h3 className="font-bold text-xl">My Quotes</h3>
                        <p className="text-gray-600">View and accept your quotes.</p>
                    </Link>
                     <Link to="/portal/invoices" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <FileText className="w-8 h-8 text-indigo-500 mb-2" />
                        <h3 className="font-bold text-xl">My Invoices</h3>
                        <p className="text-gray-600">View your payment history.</p>
                    </Link>
                     <Link to="/portal/questionnaires" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <FileQuestion className="w-8 h-8 text-indigo-500 mb-2" />
                        <h3 className="font-bold text-xl">My Questionnaires</h3>
                        <p className="text-gray-600">Complete your event details.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ClientDashboard;
