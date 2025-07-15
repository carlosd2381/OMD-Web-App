import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ClientProtectedRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to the client login page.
    if (!loading && !user) {
      navigate('/portal/login');
    }
  }, [user, loading, navigate]);

  // While checking for user, you can show a loading indicator
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is logged in, render the child routes (e.g., the dashboard)
  return user ? <Outlet /> : null;
}

export default ClientProtectedRoute;
