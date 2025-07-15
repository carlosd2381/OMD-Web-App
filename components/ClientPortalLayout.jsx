import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

function ClientPortalLayout() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/portal/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-800">Oh My Desserts! Client Portal</h1>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-4">Welcome, {user?.email}</span>
                            <button 
                                onClick={handleLogout}
                                className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-slate-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default ClientPortalLayout;

