import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link } from 'react-router-dom';

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, children, size = 'max-w-3xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`bg-white p-6 rounded-lg shadow-2xl w-full ${size}`}>
        <div className="flex justify-end">
          <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
};

// --- Role Form for Add/Edit Modal ---
const RoleForm = ({ onSave, onCancel, role, allPermissions }) => {
  const [roleName, setRoleName] = useState(role?.name || '');
  const [selectedPermissions, setSelectedPermissions] = useState(new Set(role?.permissions || []));

  const handlePermissionChange = (permissionId) => {
    const newSelection = new Set(selectedPermissions);
    if (newSelection.has(permissionId)) {
      newSelection.delete(permissionId);
    } else {
      newSelection.add(permissionId);
    }
    setSelectedPermissions(newSelection);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name: roleName, permissions: Array.from(selectedPermissions) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{role ? `Edit Role: ${role.name}` : 'Add New Role'}</h2>
      <div>
        <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">Role Name</label>
        <input
          type="text"
          id="roleName"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-800">Permissions</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border p-4 rounded-md max-h-96 overflow-y-auto">
          {allPermissions.map(p => (
            <div key={p.id} className="flex items-center">
              <input
                id={`perm-${p.id}`}
                type="checkbox"
                checked={selectedPermissions.has(p.id)}
                onChange={() => handlePermissionChange(p.id)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor={`perm-${p.id}`} className="ml-3 text-sm text-gray-700">
                <span className="font-semibold">{p.key}</span>
                <p className="text-xs text-gray-500">{p.description}</p>
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
        <button type="submit" className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">Save Role</button>
      </div>
    </form>
  );
};


// --- Main Roles Management Page ---
function SettingsRolesPage() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all roles and their assigned permissions
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`id, name, role_permissions(permission_id)`);
      if (rolesError) throw rolesError;

      const formattedRoles = rolesData.map(role => ({
        ...role,
        permissions: role.role_permissions.map(p => p.permission_id)
      }));
      setRoles(formattedRoles);

      // Fetch all available permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('key');
      if (permissionsError) throw permissionsError;
      setAllPermissions(permissionsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveRole = async (formData) => {
    try {
      if (editingRole) { // --- UPDATE EXISTING ROLE ---
        const { data: updatedRole, error: updateError } = await supabase
          .from('roles')
          .update({ name: formData.name })
          .eq('id', editingRole.id)
          .select()
          .single();
        if (updateError) throw updateError;
        
        // Remove old permissions
        await supabase.from('role_permissions').delete().eq('role_id', updatedRole.id);
        // Add new permissions
        const newPermissions = formData.permissions.map(pid => ({ role_id: updatedRole.id, permission_id: pid }));
        await supabase.from('role_permissions').insert(newPermissions);

      } else { // --- CREATE NEW ROLE ---
        const { data: newRole, error: createError } = await supabase
          .from('roles')
          .insert({ name: formData.name })
          .select()
          .single();
        if (createError) throw createError;
        
        // Add permissions
        const newPermissions = formData.permissions.map(pid => ({ role_id: newRole.id, permission_id: pid }));
        await supabase.from('role_permissions').insert(newPermissions);
      }
      
      fetchData();
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      setError(`Error saving role: ${err.message}`);
    }
  };
  
  const handleDeleteRole = async (roleId) => {
      if (window.confirm("Are you sure? This will delete the role and all its permissions.")) {
          try {
              await supabase.from('roles').delete().eq('id', roleId);
              fetchData();
          } catch(err) {
              setError(`Error deleting role: ${err.message}`);
          }
      }
  };

  const openAddModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
           <Link to="/settings" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">&larr; Back to Settings</Link>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-lg text-gray-600 mt-1">Define user roles and control access to features.</p>
        </div>
        
        <div className="text-right mb-4">
            <button onClick={openAddModal} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700">
                + Add New Role
            </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-5 py-3">Role Name</th>
                  <th className="px-5 py-3">Permissions Count</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="3" className="text-center py-10">Loading roles...</td></tr>
                ) : roles.length > 0 ? (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900 font-semibold">{role.name}</p></td>
                      <td className="px-5 py-4 text-sm"><p className="text-gray-900">{role.permissions.length}</p></td>
                      <td className="px-5 py-4 text-sm text-center space-x-3">
                        <button onClick={() => openEditModal(role)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                        <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="text-center py-10 text-gray-500">No roles found. Add one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <RoleForm 
          onSave={handleSaveRole} 
          onCancel={() => setIsModalOpen(false)} 
          role={editingRole} 
          allPermissions={allPermissions}
        />
      </Modal>
    </div>
  );
}

export default SettingsRolesPage;

