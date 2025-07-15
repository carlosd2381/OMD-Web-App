import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

function ClientFiles() {
  const { clientData } = useOutletContext();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchFiles = useCallback(async () => {
    if (!clientData?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('client-files').list(clientData.id, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' }, });
      if (error) throw error;
      setFiles(data);
    } catch (error) {
      setError(`Error fetching files: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [clientData]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = (event) => { setSelectedFile(event.target.files[0]); };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a file to upload.'); return; }
    setUploading(true);
    setError(null);
    try {
      const { error } = await supabase.storage.from('client-files').upload(`${clientData.id}/${selectedFile.name}`, selectedFile, { cacheControl: '3600', upsert: true, });
      if (error) throw error;
      fetchFiles();
      setSelectedFile(null);
    } catch (error) {
      setError(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName) => { if (window.confirm(`Are you sure?`)) { try { await supabase.storage.from('client-files').remove([`${clientData.id}/${fileName}`]); fetchFiles(); } catch (error) { setError(`Error deleting file: ${error.message}`); } } };

  if (loading) return <div>Loading files...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Files</h3>
      <div className="flex items-center space-x-4 p-4 border rounded-lg mb-6">
        <input type="file" onChange={handleFileSelect} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map(file => (<div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md"><span className="font-medium text-gray-800">{file.name}</span><div className="flex items-center space-x-4"><a href={supabase.storage.from('client-files').getPublicUrl(`${clientData.id}/${file.name}`).data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 text-sm">Download</a><button onClick={() => handleDelete(file.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button></div></div>))
        ) : (
          <p className="text-center text-gray-500 py-4">No files have been uploaded for this client.</p>
        )}
      </div>
    </div>
  );
}

export default ClientFiles;