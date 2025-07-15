import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../utils/supabaseClient';
import EventDetailsModal from '../components/EventDetailsModal';

// Setup the localizer by providing the moment Object
const localizer = momentLocalizer(moment);

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // UPDATE: Fetch additional fields for the modal details
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          event_name,
          event_date,
          start_time,
          end_time,
          venue_name,
          guest_count,
          services_requested,
          contacts ( id, full_name )
        `);

      if (error) throw error;

      const formattedEvents = data.map(event => {
        const eventDate = moment(event.event_date);
        const startTime = event.start_time ? moment(event.start_time, 'HH:mm:ss') : moment().startOf('day');
        const endTime = event.end_time ? moment(event.end_time, 'HH:mm:ss') : moment().endOf('day');

        return {
          id: event.id,
          title: `${event.contacts.full_name} - ${event.event_name || 'Event'}`,
          start: eventDate.clone().hour(startTime.hour()).minute(startTime.minute()).toDate(),
          end: eventDate.clone().hour(endTime.hour()).minute(endTime.minute()).toDate(),
          allDay: !event.start_time,
          // UPDATE: Store all original data for the modal
          contactId: event.contacts.id,
          contactName: event.contacts.full_name,
          eventName: event.event_name,
          venueName: event.venue_name,
          guestCount: event.guest_count,
          servicesRequested: event.services_requested || [],
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading calendar...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-lg h-[85vh]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      <EventDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </>
  );
}

export default CalendarPage;
