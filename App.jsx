// FILE: src/App.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext'; 

function App() {
  return (
    <AuthProvider>
      {/* UPDATE: Using a standard default color */}
      <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;