
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSecurityWrapperProps {
  children: React.ReactNode;
}

const AdminSecurityWrapper: React.FC<AdminSecurityWrapperProps> = ({ children }) => {
  const [securityChecked, setSecurityChecked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const performSecurityChecks = async () => {
      try {
        console.log('Performing security checks...');
        
        // Check if user session is valid
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          await supabase.auth.signOut();
          return;
        }

        if (session?.user) {
          console.log('Checking user profile for:', session.user.email);
          
          // Verify admin status in real-time
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_type, verification_status, email')
            .eq('id', session.user.id)
            .single();

          console.log('Profile check result:', { profile, profileError });

          // If profile doesn't exist but email is the default admin, allow access
          if (profileError && session.user.email === 'temanly.admin@gmail.com') {
            console.log('Default admin email detected, allowing access despite missing profile');
            setSecurityChecked(true);
            return;
          }

          if (profileError || !profile) {
            console.error('Profile verification failed:', profileError);
            toast({
              title: "Access Denied", 
              description: "Unable to verify admin profile",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            return;
          }

          // Updated security checks for new email format
          const isValidAdmin = profile.user_type === 'admin' && 
                              profile.verification_status === 'verified' &&
                              (profile.email === 'temanly.admin@gmail.com' || 
                               profile.email?.endsWith('@temanly.com'));

          if (!isValidAdmin) {
            console.warn('Invalid admin access attempt');
            toast({
              title: "Access Denied",
              description: "Invalid admin credentials detected",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            return;
          }

          console.log('Security checks passed');
        }

        setSecurityChecked(true);
      } catch (error) {
        console.error('Security check failed:', error);
        await supabase.auth.signOut();
      }
    };

    performSecurityChecks();

    // Set up real-time monitoring for admin status changes
    const channel = supabase
      .channel('admin-security')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_type=eq.admin`
        }, 
        (payload) => {
          console.log('Admin profile updated:', payload);
          // Re-check security when admin profiles are modified
          performSecurityChecks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (!securityChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Performing security checks...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminSecurityWrapper;
