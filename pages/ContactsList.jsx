import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import AddLeadModal from '../components/AddLeadModal';
import EditLeadModal from '../components/EditLeadModal';

// A small component for the filter buttons
const FilterButton = ({ filter, currentFilter, setFilter, children }) => (
  <button
    onClick={() => setFilter(filter)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex-1 ${
      currentFilter === filter
        ? 'bg-slate-700 text-white shadow'
        : 'bg-white text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contacts')
        // UPDATE: Fetching more event details for the new columns
        .select(`
          id,
          full_name,
          status,
          events (
            event_date,
            venue_name,
            guest_count,
            services_requested
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'All') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setContacts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) {
      try {
        await supabase.from('events').delete().eq('contact_id', contactId);
        await supabase.from('contacts').delete().eq('id', contactId);
        fetchContacts();
      } catch (error) {
        setError(`Error deleting contact: ${error.message}`);
      }
    }
  };

  if (loading) return <div>Loading contacts...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Client Hub</h2>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition duration-300">
          + Add New Contact
        </button>
      </div>

      <div className="flex space-x-2 mb-4 p-1 bg-gray-200 rounded-lg">
        <FilterButton filter="All" currentFilter={filter} setFilter={setFilter}>All</FilterButton>
        <FilterButton filter="Lead" currentFilter={filter} setFilter={setFilter}>Leads</FilterButton>
        <FilterButton filter="Active Client" currentFilter={filter} setFilter={setFilter}>Active Clients</FilterButton>
        <FilterButton filter="Past Client" currentFilter={filter} setFilter={setFilter}>Past Clients</FilterButton>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            {/* UPDATE: Table headers changed to match new requirements */}
            <tr className="border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Client Name</th>
              <th className="px-5 py-3">Event Date</th>
              <th className="px-5 py-3">Venue</th>
              <th className="px-5 py-3">Est. Pax</th>
              <th className="px-5 py-3">Services Requested</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length > 0 ? (
              contacts.map((contact) => {
                const event = contact.events && contact.events.length > 0 ? contact.events[0] : {};
                return (
                  <tr key={contact.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {/* UPDATE: Table cells now display the new data */}
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap font-semibold">{contact.full_name}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{event.event_date ? new Date(event.event_date).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'N/A'}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{event.venue_name || 'N/A'}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{event.guest_count || 'N/A'}</p></td>
                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap truncate max-w-xs">{event.services_requested?.join(', ') || 'N/A'}</p></td>
                    <td className="px-5 py-4 text-sm">
                      <span className="relative inline-block px-3 py-1 font-semibold leading-tight text-purple-900">
                        <span aria-hidden className="absolute inset-0 bg-purple-200 opacity-50 rounded-full"></span>
                        <span className="relative">{contact.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm flex items-center space-x-4">
                      <Link to={`/client-hub/${contact.id}`} className="text-indigo-600 hover:text-indigo-900">View Hub</Link>
                      <button onClick={() => handleEdit(contact)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                      <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr><td colSpan="7" className="text-center py-10 text-gray-500">No contacts found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddLeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onLeadAdded={fetchContacts} />
      <EditLeadModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onLeadUpdated={fetchContacts} 
        editingLead={editingContact} 
      />
    </div>
  );
}

export default ContactsList;
