import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; data: any }>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<AuthError | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize auth session on mount
  useEffect(() => {
    console.log('--- AUTH INITIALIZATION DEBUG ---');
    const initializeAuth = async () => {
      console.log('🔵 [AUTH INIT] Initializing auth...');
      try {
        const { data } = await supabase.auth.getSession();
        console.log('🔵 [AUTH INIT] Session check:', { hasSession: !!data.session, userId: data.session?.user?.id });
        if (data.session) {
          console.log('✅ [AUTH INIT] Session found, setting user');
          setSession(data.session);
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
          });
        } else {
          console.log('⚠️ [AUTH INIT] No session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        // Check localStorage for admin flag
        const isAdminLocal = localStorage.getItem('isAdmin');
        console.log('🔵 [AUTH INIT] Checking localStorage.isAdmin:', isAdminLocal);
        if (isAdminLocal === 'true') {
          console.log('✅ [AUTH INIT] Found admin flag in localStorage, setting isAdmin to true');
          setIsAdmin(true);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('🔵 [SIGNUP] Starting signup for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('🔵 [SIGNUP] Auth response:', { error: error?.message, userId: data?.user?.id });

    if (!error && data?.user?.id) {
      console.log('✅ [SIGNUP] User created successfully!');
      console.log('💡 [PROFILE CREATE] Skipped - database trigger will create profile automatically');
      console.log('✅ [PROFILE CREATE] Profile will be created server-side via PostgreSQL trigger');
    } else {
      console.error('❌ [SIGNUP] Signup failed:', error?.message);
    }

    return { error, data };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error, data };
  };

  const adminLogin = async (username: string, password: string) => {
    const expectedUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (username === expectedUsername && password === expectedPassword) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      return true;
    }

    return false;
  };

  const signOut = async () => {
    console.log('🔵 [AUTH SIGNOUT] Signing out user...');
    console.log('🔵 [AUTH SIGNOUT] Current isAdmin state:', isAdmin);
    console.log('🔵 [AUTH SIGNOUT] Current localStorage.isAdmin:', localStorage.getItem('isAdmin'));
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [AUTH SIGNOUT] Supabase error:', error);
    } else {
      console.log('✅ [AUTH SIGNOUT] Supabase signOut successful');
    }
    
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    console.log('✅ [AUTH SIGNOUT] Cleared localStorage.isAdmin and isAdmin state');
    
    return error;
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    adminLogin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
