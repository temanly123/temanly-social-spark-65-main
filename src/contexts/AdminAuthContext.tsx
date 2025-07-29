
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isAdmin: boolean;
  loading: boolean;
  signInWithCredentials: (username: string, email: string, passcode: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      console.log('🔍 Checking admin auth...');

      // Check localStorage for admin session first
      const adminSession = localStorage.getItem('temanly_admin_session');
      console.log('📱 Admin session from localStorage:', adminSession);

      if (adminSession === 'true') {
        console.log('✅ Found valid admin session in localStorage');
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Try Supabase auth as fallback
      console.log('🔄 Checking Supabase session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📊 Supabase session:', session?.user?.id ? 'Found user' : 'No user');

      if (session?.user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .eq('user_type', 'admin')
          .single();

        console.log('👤 Profile check result:', profile);

        if (profile) {
          console.log('✅ User is admin, setting session');
          setIsAdmin(true);
          localStorage.setItem('temanly_admin_session', 'true');
        } else {
          console.log('❌ User is not admin');
        }
      }
    } catch (error) {
      console.error('❌ Error checking admin auth:', error);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const signInWithCredentials = async (username: string, email: string, passcode: string) => {
    try {
      console.log('Attempting admin sign in');

      // Simple fallback admin credentials for testing
      if (username === 'admin' && email === 'admin@temanly.com' && passcode === 'admin123') {
        console.log('Using fallback admin credentials');
        setIsAdmin(true);
        localStorage.setItem('temanly_admin_session', 'true');
        return { error: undefined };
      }

      // Try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: passcode,
      });

      if (authError) {
        console.log('Auth error:', authError.message);
        // If Supabase fails, check fallback credentials
        if (username === 'admin' && email === 'admin@temanly.com' && passcode === 'admin123') {
          console.log('Supabase failed, using fallback admin credentials');
          setIsAdmin(true);
          localStorage.setItem('temanly_admin_session', 'true');
          return { error: undefined };
        }
        return { error: authError.message };
      }

      if (authData.user) {
        // Verify user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, name')
          .eq('id', authData.user.id)
          .eq('user_type', 'admin')
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return { error: 'Access denied. Admin privileges required.' };
        }

        console.log('Admin authenticated successfully');
        setIsAdmin(true);
        return {};
      }

      return { error: 'Authentication failed' };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    console.log('Admin signing out');
    await supabase.auth.signOut();
    localStorage.removeItem('temanly_admin_session');
    setIsAdmin(false);
  };

  const value = {
    isAdmin,
    loading,
    signInWithCredentials,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
