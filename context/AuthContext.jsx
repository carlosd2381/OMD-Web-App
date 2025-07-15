import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener is the single source of truth. It fires on initial load
    // and whenever the auth state changes (login/logout).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // We are done loading as soon as we know if a session exists or not.
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    loading, // Expose the loading state
    user: session?.user,
    signOut: () => supabase.auth.signOut(),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  };

  // The children are rendered immediately. The loading state is now handled
  // by the ProtectedRoute component, which consumes this context.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
