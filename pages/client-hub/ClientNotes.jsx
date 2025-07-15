import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ClientNotes() {
  const { clientData } = useOutletContext();
  const { profile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [noteAuthorId, setNoteAuthorId] = useState('');

  useEffect(() => { if (profile) { setNoteAuthorId(profile.id); } }, [profile]);

  const fetchData = useCallback(async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const [notesRes, membersRes] = await Promise.all([ supabase.from('notes').select('id, created_at, note_content, profiles ( full_name )').eq('contact_id', clientData.id).order('created_at', { ascending: false }), supabase.from('profiles').select('id, full_name') ]);
      if (notesRes.error) throw notesRes.error;
      if (membersRes.error) throw membersRes.error;
      setNotes(notesRes.data);
      setTeamMembers(membersRes.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [clientData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (newNote.trim() === '') return;
    try {
      const { data, error } = await supabase.from('notes').insert([{ contact_id: clientData.id, note_content: newNote, user_id: noteAuthorId }]).select(`id, created_at, note_content, profiles ( full_name )`);
      if (error) throw error;
      setNotes([data[0], ...notes]);
      setNewNote('');
    } catch (error) {
      setError(`Error adding note: ${error.message}`);
    }
  };

  const handleDeleteNote = async (noteId) => { if (window.confirm('Are you sure?')) { try { await supabase.from('notes').delete().eq('id', noteId); setNotes(notes.filter(n => n.id !== noteId)); } catch (error) { setError(`Error deleting note: ${error.message}`); } } };

  if (loading) return <div>Loading notes...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Notes</h3>
      <form onSubmit={handleAddNote} className="mb-6">
        <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a new note..." className="w-full p-3 border border-gray-300 rounded-md shadow-sm" rows="4"></textarea>
        <div className="flex justify-between items-center mt-2">
            <div><label htmlFor="noteAuthor" className="text-sm font-medium text-gray-700 mr-2">Added by:</label><select id="noteAuthor" value={noteAuthorId} onChange={(e) => setNoteAuthorId(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm">{teamMembers.map(member => (<option key={member.id} value={member.id}>{member.full_name}</option>))}</select></div>
            <button type="submit" className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">Add Note</button>
        </div>
      </form>
      <div className="space-y-4">
        {notes.length > 0 ? (
          notes.map(note => (<div key={note.id} className="bg-gray-50 p-4 rounded-md border"><p className="text-gray-800 whitespace-pre-wrap">{note.note_content}</p><div className="text-xs text-gray-500 mt-2 flex justify-between items-center"><span>By {note.profiles?.full_name || 'Unknown User'} on {new Date(note.created_at).toLocaleString()}</span><button onClick={() => handleDeleteNote(note.id)} className="text-red-400 hover:text-red-600">Delete</button></div></div>))
        ) : (
          <p className="text-center text-gray-500 py-4">No notes have been added for this client yet.</p>
        )}
      </div>
    </div>
  );
}

export default ClientNotes;