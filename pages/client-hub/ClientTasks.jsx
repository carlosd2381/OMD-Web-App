import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const TaskCategory = ({ title, tasks, onToggle, onDelete, onAssign, onAddTask, teamMembers, eventDate }) => {
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('no due date');
  const [newAssignedTo, setNewAssignedTo] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskDescription.trim() === '') return;
    const taskData = { description: newTaskDescription, assigneeId: newAssignedTo, category: title, due_date: null }; // Simplified due date
    onAddTask(taskData);
    setNewTaskDescription('');
    setNewAssignedTo('');
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-blue-600 mb-3">{title}</h3>
      <div className="space-y-2">
        {tasks.map(task => (<div key={task.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100"><div className="flex items-center flex-grow"><input type="checkbox" checked={task.is_completed} onChange={() => onToggle(task)} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><span className={`ml-4 text-gray-800 ${task.is_completed ? 'line-through text-gray-400' : ''}`}>{task.task_description}</span></div><div className="flex items-center space-x-4"><select value={task.assigned_to_user_id || ''} onChange={(e) => onAssign(task.id, e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm"><option value="">Unassigned</option>{teamMembers.map(member => (<option key={member.id} value={member.id}>{member.full_name}</option>))}</select><button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-700 text-xl font-bold">&times;</button></div></div>))}
        <form onSubmit={handleAddTask} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border-t-2 border-dashed"><div className="flex items-center flex-grow space-x-4"><input type="text" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Call Venue to confirm details" className="flex-grow w-full px-3 py-1 border border-gray-300 rounded-md text-sm" /><select value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm w-48"><option>no due date</option><option>1 day before...</option></select></div><div className="flex items-center space-x-4 ml-4"><select value={newAssignedTo} onChange={(e) => setNewAssignedTo(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm"><option value="">Unassigned</option>{teamMembers.map(member => (<option key={member.id} value={member.id}>{member.full_name}</option>))}</select><button type="submit" className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300">Add</button></div></form>
      </div>
    </div>
  );
};

function ClientTasks() {
  const { clientData } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const [tasksRes, membersRes] = await Promise.all([ supabase.from('tasks').select('*').eq('contact_id', clientData.id).order('created_at'), supabase.from('profiles').select('id, full_name') ]);
      if (tasksRes.error) throw tasksRes.error;
      if (membersRes.error) throw membersRes.error;
      setTasks(tasksRes.data);
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

  const handleAddTask = async (taskData) => { try { const { data, error } = await supabase.from('tasks').insert([{ contact_id: clientData.id, task_description: taskData.description, category: taskData.category, assigned_to_user_id: taskData.assigneeId || null, due_date: taskData.due_date, }]).select(); if (error) throw error; setTasks(prevTasks => [...prevTasks, ...data]); } catch (error) { setError(`Error adding task: ${error.message}`); } };
  const handleToggleComplete = async (task) => { try { const { data, error } = await supabase.from('tasks').update({ is_completed: !task.is_completed, completed_at: !task.is_completed ? new Date().toISOString() : null }).eq('id', task.id).select(); if (error) throw error; setTasks(tasks.map(t => (t.id === task.id ? data[0] : t))); } catch (error) { setError(`Error updating task: ${error.message}`); } };
  const handleDeleteTask = async (taskId) => { try { const { error } = await supabase.from('tasks').delete().eq('id', taskId); if (error) throw error; setTasks(tasks.filter(t => t.id !== taskId)); } catch (error) { setError(`Error deleting task: ${error.message}`); } };
  const handleAssignTask = async (taskId, userId) => { try { const { data, error } = await supabase.from('tasks').update({ assigned_to_user_id: userId || null }).eq('id', taskId).select(); if (error) throw error; setTasks(tasks.map(t => (t.id === taskId ? data[0] : t))); } catch (error) { setError(`Error assigning task: ${error.message}`); } };

  const groupedTasks = tasks.reduce((acc, task) => { const category = task.category || 'General'; if (!acc[category]) { acc[category] = []; } acc[category].push(task); return acc; }, {});
  const primaryEventDate = clientData.events && clientData.events.length > 0 ? clientData.events[0].event_date : null;

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-800">Task Lists</h3>
        <div className="flex items-center space-x-2">
            <select className="text-sm border-gray-300 rounded-md shadow-sm"><option>Apply a Task List...</option></select>
            <button className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">Apply</button>
        </div>
      </div>
      {Object.keys(groupedTasks).length > 0 ? (
        Object.entries(groupedTasks).map(([category, tasksInCategory]) => (<TaskCategory key={category} title={category} tasks={tasksInCategory} onToggle={handleToggleComplete} onDelete={handleDeleteTask} onAssign={handleAssignTask} onAddTask={handleAddTask} teamMembers={teamMembers} eventDate={primaryEventDate} />))
      ) : (
        <p className="text-center text-gray-500 py-4">No tasks assigned yet. Add a task to a new category below.</p>
      )}
       {!Object.keys(groupedTasks).length > 0 && (
         <div className="mt-4"><TaskCategory title="Pre-Event" tasks={[]} onToggle={handleToggleComplete} onDelete={handleDeleteTask} onAssign={handleAssignTask} onAddTask={handleAddTask} teamMembers={teamMembers} eventDate={primaryEventDate} /></div>
       )}
    </div>
  );
}

export default ClientTasks;