import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const TabNavLink = ({ to, children }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `px-4 py-2 font-semibold border-b-2 transition-colors duration-300 whitespace-nowrap ` +
      (isActive ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:border-gray-300')
    }
  >
    {children}
  </NavLink>
);

// UPDATE: A new reusable component to display info fields in the header
const InfoField = ({ label, value }) => (
    <div className="text-center">
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className="text-lg font-semibold text-slate-800">{value || 'N/A'}</p>
    </div>
);

function ClientHub() {
  const { id } = useParams();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select(`*, events (*)`)
          .eq('id', id)
          .single();
        if (error) throw error;
        setClientData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [id]);

  if (loading) return <div>Loading client profile...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!clientData) return <div>Client not found.</div>;

  // Get the primary event (assuming the first one)
  const primaryEvent = clientData.events && clientData.events.length > 0 ? clientData.events[0] : {};

  return (
    <div>
      {/* UPDATE: The header section is now redesigned to display event info */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="flex justify-between items-start">
          {/* Left side: Contact Info */}
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{clientData.full_name}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Email:</strong> {clientData.email}</p>
                <p><strong>Phone:</strong> {clientData.phone}</p>
            </div>
          </div>
          {/* Right side: Status and Key Event Details */}
          <div className="text-right">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                Status: {clientData.pipeline_stage}
            </span>
            <div className="mt-4 flex items-center space-x-8 text-slate-700">
                <InfoField label="Event Date" value={primaryEvent.event_date ? new Date(primaryEvent.event_date).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'N/A'} />
                <InfoField label="Venue" value={primaryEvent.venue_name} />
                <InfoField label="Est. Guests" value={primaryEvent.guest_count} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <TabNavLink to={`/client-hub/${id}`}>Overview</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/quotes`}>Quotes & Orders</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/financials`}>Financials</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/event-sheet`}>Event Sheet</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/event-financials`}>Event Financials</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/mail`}>Mail</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/contracts`}>Contracts</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/questionnaires`}>Questionnaires</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/tasks`}>Tasks</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/notes`}>Notes</TabNavLink>
          <TabNavLink to={`/client-hub/${id}/files`}>Files</TabNavLink>
        </nav>
      </div>

      <div className="mt-8">
        <Outlet context={{ clientData }} />
      </div>
    </div>
  );
}

export default ClientHub;