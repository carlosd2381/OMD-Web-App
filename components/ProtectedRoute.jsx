import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // Get both the user and the loading state from the context
  const { user, loading } = useAuth();

  // 1. If the auth state is still being determined, show a loading indicator.
  //    This prevents the premature redirect to /login.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading Application...</p>
      </div>
    );
  }

  // 2. If loading is complete and there is still no user, then redirect.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is complete and there is a user, render the main app.
  return <Outlet />;
}

export default ProtectedRoute;
