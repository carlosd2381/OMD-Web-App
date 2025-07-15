import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

// A reusable component for displaying a detail row
const DetailRow = ({ label, value }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
    <p className="text-gray-900">{value || 'N/A'}</p>
  </div>
);

function EventDetailsModal({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null;

  // Format the start and end times for display
  const startTime = moment(event.start).format('h:mm A');
  const endTime = moment(event.end).format('h:mm A');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-brand-brown)]">{event.eventName || 'Event Details'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>
        
        <div className="space-y-6">
          {/* Main Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailRow label="Client Name" value={event.contactName} />
            <DetailRow label="Event Date" value={moment(event.start).format('dddd, MMMM Do YYYY')} />
            <DetailRow label="Venue" value={event.venueName} />
            <DetailRow label="Guest Count" value={event.guestCount} />
            <DetailRow label="Start Time" value={event.allDay ? 'N/A' : startTime} />
            <DetailRow label="End Time" value={event.allDay ? 'N/A' : endTime} />
          </div>

          {/* Services Requested Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Services Requested</h3>
            {event.servicesRequested && event.servicesRequested.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {event.servicesRequested.map((service, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">No specific services listed.</p>
            )}
          </div>
          
          <div className="pt-6 border-t mt-6">
            <Link 
              to={`/client-hub/${event.contactId}`} 
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Go to Client Hub &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;
