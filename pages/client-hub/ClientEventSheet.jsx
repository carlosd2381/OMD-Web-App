import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Reusable component for sections of the run sheet
const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-200 p-2">{title}</h2>
    <div className="border border-gray-200 p-4">
      {children}
    </div>
  </div>
);

// Reusable component for fields that can be edited
const EditableField = ({ label, value, name, isEditing, onChange, type = 'text', as = 'input' }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    {isEditing ? (
      as === 'textarea' ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          className="font-semibold text-gray-800 w-full p-1 border border-gray-300 rounded-md"
          rows="4"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="font-semibold text-gray-800 w-full p-1 border border-gray-300 rounded-md"
        />
      )
    ) : (
      as === 'textarea' ? (
        <p className="font-semibold text-gray-800 h-auto p-1 whitespace-pre-wrap">{value || 'N/A'}</p>
      ) : (
        <p className="font-semibold text-gray-800 h-8 p-1">{value || 'N/A'}</p>
      )
    )}
  </div>
);


function ClientEventSheet() {
  const { clientData } = useOutletContext();
  const [quoteItems, setQuoteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // State for PDF generation
  const [formData, setFormData] = useState({});
  
  const [assignedEquipment, setAssignedEquipment] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [equipmentToAdd, setEquipmentToAdd] = useState('');
  
  const printRef = useRef();

  const primaryEvent = clientData?.events?.[0];

  const fetchEventDetails = useCallback(async () => {
    if (!primaryEvent?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, contacts(*, partners(*)), quotes(quote_items(*, menu_items(name)))`)
        .eq('id', primaryEvent.id)
        .single();
      if (error) throw error;
      
      const initialFormData = {
        ...data,
        planner_name: data.planner_name ?? data.contacts?.partners?.primary_contact_name,
        planner_phone: data.planner_phone ?? data.contacts?.partners?.phone,
        planner_email: data.planner_email ?? data.contacts?.partners?.email,
        bride_name: data.bride_name ?? data.contacts?.full_name,
        bride_phone: data.bride_phone ?? data.contacts?.phone,
      };
      
      setFormData(initialFormData); 
      setQuoteItems(data.quotes?.quote_items || []);

      const { data: assignedData, error: assignedError } = await supabase
        .from('event_equipment')
        .select('id, equipment(*)')
        .eq('event_id', primaryEvent.id);
      if (assignedError) throw assignedError;
      setAssignedEquipment(assignedData);

      const { data: allData, error: allError } = await supabase
        .from('equipment')
        .select('*')
        .order('name');
      if (allError) throw allError;
      setAllEquipment(allData);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [primaryEvent, clientData]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveRunSheet = async () => {
    try {
        const { id, contacts, quotes, ...updateData } = formData; 
        const { error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', id);
        if (error) throw error;
        setIsEditing(false);
    } catch (error) {
        setError(`Error saving run sheet: ${error.message}`);
    }
  };

  const handleSaveAndModify = async () => {
    if (!window.confirm('Warning: This will modify the original Client and Planner contact information. Are you sure you want to proceed?')) {
        return;
    }
    try {
        await handleSaveRunSheet();
        if (clientData?.id) {
            await supabase.from('contacts').update({ phone: formData.bride_phone, full_name: formData.bride_name }).eq('id', clientData.id);
        }
        if (clientData?.partners?.id) {
            await supabase.from('partners').update({ 
                primary_contact_name: formData.planner_name,
                phone: formData.planner_phone,
                email: formData.planner_email
            }).eq('id', clientData.partners.id);
        }
    } catch (error) {
        setError(`Error modifying records: ${error.message}`);
    }
  };

  const handleGeneratePDF = async () => {
    const element = printRef.current;
    if (!element) {
        setError("Could not find the element to print.");
        return;
    }
    const buttons = element.querySelector('#action-buttons');
    
    setIsGeneratingPdf(true);
    if (buttons) buttons.style.visibility = 'hidden';

    // Store original styles to reset them later
    const originalBodyBg = document.body.style.backgroundColor;
    const originalElementBg = element.style.backgroundColor;

    // Force a simple background color on the whole page to avoid oklch issues
    document.body.style.backgroundColor = 'white';
    element.style.backgroundColor = 'white';

    // Give the DOM a moment to update styles
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const options = {
            scale: 2,
            useCORS: true,
            logging: true,
        };

        const canvas = await html2canvas(element, options);
        const data = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`RunSheet-${formData.event_name || clientData.full_name}.pdf`);
    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
        setError(`Could not generate PDF: ${errorMessage}. Please check the console for details.`);
    } finally {
        // Reset styles and button visibility
        document.body.style.backgroundColor = originalBodyBg;
        element.style.backgroundColor = originalElementBg;
        if (buttons) buttons.style.visibility = 'visible';
        setIsGeneratingPdf(false);
    }
  };


  const handleAddEquipment = async () => {
    if (!equipmentToAdd) return;
    const { error } = await supabase
      .from('event_equipment')
      .insert({ event_id: primaryEvent.id, equipment_id: equipmentToAdd });

    if (error) {
      setError(error.message);
    } else {
      fetchEventDetails();
      setEquipmentToAdd('');
    }
  };
  
  const handleRemoveEquipment = async (assignmentId) => {
    const { error } = await supabase
      .from('event_equipment')
      .delete()
      .eq('id', assignmentId);
    
    if (error) {
      setError(error.message);
    } else {
      fetchEventDetails();
    }
  };


  if (loading) return <div>Loading Event Sheet...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!primaryEvent) return <div className="bg-white p-6 rounded-lg shadow-lg">No event found for this client.</div>;
  
  return (
    <div ref={printRef} className="bg-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Event Run Sheet</h1>
        <div id="action-buttons" className="flex space-x-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleSaveRunSheet} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Save Run Sheet</button>
              <button onClick={handleSaveAndModify} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">Save & Modify</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600">Edit</button>
              <button onClick={handleGeneratePDF} disabled={isGeneratingPdf} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400">
                {isGeneratingPdf ? 'Generating...' : 'PDF'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <Section title="Venue Information">
            <div className="space-y-4">
              <EditableField label="Venue Area" name="venue_area" value={formData.venue_area} isEditing={isEditing} onChange={handleChange} />
              <EditableField label="Venue" name="venue_name" value={formData.venue_name} isEditing={isEditing} onChange={handleChange} />
              <EditableField label="Location" name="venue_address" value={formData.venue_address} isEditing={isEditing} onChange={handleChange} />
            </div>
        </Section>
        <Section title="Planner Information">
             <div className="space-y-4">
                <EditableField label="Name" name="planner_name" value={formData.planner_name} isEditing={isEditing} onChange={handleChange} />
                <EditableField label="Phone #" name="planner_phone" value={formData.planner_phone} isEditing={isEditing} onChange={handleChange} />
                <EditableField label="E-Mail" name="planner_email" value={formData.planner_email} isEditing={isEditing} onChange={handleChange} />
             </div>
        </Section>
      </div>

      <Section title="Couples Information">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EditableField label="Bride Name" name="bride_name" value={formData.bride_name} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Bride Phone #" name="bride_phone" value={formData.bride_phone} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Groom Name" name="groom_name" value={formData.groom_name} isEditing={isEditing} onChange={handleChange}/>
          <EditableField label="Groom Phone #" name="groom_phone" value={formData.groom_phone} isEditing={isEditing} onChange={handleChange}/>
        </div>
      </Section>

      <Section title="Event Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EditableField label="Event Date" name="event_date" type="date" value={formData.event_date} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Start Time" name="start_time" type="time" value={formData.start_time} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="End Time" name="end_time" type="time" value={formData.end_time} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Meet Time" name="meet_time" type="time" value={formData.meet_time} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Departure Time" name="departure_time" type="time" value={formData.departure_time} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Est. PAX" name="guest_count" type="number" value={formData.guest_count} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Min. PAX" name="min_pax" type="number" value={formData.min_pax} isEditing={isEditing} onChange={handleChange} />
          <EditableField label="Actual PAX" name="actual_pax" type="number" value={formData.actual_pax} isEditing={isEditing} onChange={handleChange} />
        </div>
      </Section>
      
      <Section title="Staff">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EditableField label="Driver A" name="driver_a" value={formData.driver_a} isEditing={isEditing} onChange={handleChange} />
            <EditableField label="Driver B" name="driver_b" value={formData.driver_b} isEditing={isEditing} onChange={handleChange} />
            <EditableField label="Operator 1" name="operator_1" value={formData.operator_1} isEditing={isEditing} onChange={handleChange} />
            <EditableField label="Operator 2" name="operator_2" value={formData.operator_2} isEditing={isEditing} onChange={handleChange} />
            <EditableField label="Operator 3" name="operator_3" value={formData.operator_3} isEditing={isEditing} onChange={handleChange} />
            <EditableField label="Operator 4" name="operator_4" value={formData.operator_4} isEditing={isEditing} onChange={handleChange} />
         </div>
      </Section>

      <Section title="Services Required">
        <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="p-2 text-left font-semibold">Item</th><th className="p-2 text-left font-semibold">Qty.</th></tr></thead>
            <tbody>
                {quoteItems.map(item => (<tr key={item.id} className="border-b"><td className="p-2">{item.menu_items.name}</td><td className="p-2">{item.quantity}</td></tr>))}
            </tbody>
        </table>
      </Section>
      
      <Section title="Equipment Assignments">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <select 
                value={equipmentToAdd}
                onChange={(e) => setEquipmentToAdd(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Select equipment to add --</option>
                {allEquipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name} ({eq.type})</option>
                ))}
              </select>
              <button onClick={handleAddEquipment} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">Add</button>
            </div>
            <div className="space-y-2 pt-4">
              {assignedEquipment.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                  <span className="font-medium">{item.equipment.name}</span>
                  <button onClick={() => handleRemoveEquipment(item.id)} className="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {assignedEquipment.length > 0 ? (
              <ul className="list-disc list-inside">
                {assignedEquipment.map(item => (
                  <li key={item.id} className="font-semibold text-gray-800">{item.equipment.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No equipment assigned.</p>
            )}
          </div>
        )}
      </Section>

      <Section title="Additional Event Info - Issues - Problems">
        <EditableField label="" name="additional_info" value={formData.additional_info} isEditing={isEditing} onChange={handleChange} as="textarea" />
      </Section>
    </div>
  );
}

export default ClientEventSheet;
