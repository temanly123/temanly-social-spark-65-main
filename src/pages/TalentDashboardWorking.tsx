import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TalentDashboardWorking = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('🚀 TalentDashboardWorking loaded', { user, isAuthenticated, isLoading });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching profile data for user:', user.id);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError('Failed to load profile: ' + profileError.message);
        } else {
          console.log('Profile loaded:', profile);
          setProfileData(profile);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const createCompanionProfile = async () => {
    if (!user?.email) return;

    try {
      const companionId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: companionId,
          email: user.email,
          name: user.name || 'Companion',
          full_name: user.name || 'Companion',
          user_type: 'companion',
          verification_status: 'verified',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const profileSelection = {
        profileId: companionId,
        userType: 'companion',
        email: user.email
      };
      localStorage.setItem('selectedProfile', JSON.stringify(profileSelection));

      toast({
        title: "Success",
        description: "Companion profile created! Refreshing...",
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error creating companion profile:', error);
      toast({
        title: "Error",
        description: "Failed to create companion profile: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Auth Loading: {isLoading ? 'true' : 'false'}</p>
            <p>Data Loading: {loading ? 'true' : 'false'}</p>
            <p>User: {user ? 'exists' : 'null'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Authenticated</h2>
          <p className="mb-4">Please log in to access the talent dashboard.</p>
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Access denied - not a companion
  if (user.user_type !== 'companion') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only talents can access this dashboard.</p>
          <p className="text-sm text-gray-500 mb-4">Current user type: {user.user_type}</p>
          
          <div className="space-y-3">
            <Button onClick={createCompanionProfile} className="w-full">
              Create Companion Profile
            </Button>
            
            <a 
              href="/talent-dashboard-debug" 
              className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Debug & Fix Issue
            </a>
            
            <a 
              href="/user-dashboard" 
              className="block text-blue-600 hover:underline text-sm"
            >
              Go to User Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Profile data missing
  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Profile Data Missing</h2>
          <p className="mb-4">Unable to load profile data.</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Success - render dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Talent Dashboard</h1>
        <p className="text-lg mb-4">Welcome back, {profileData.name}!</p>
        
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Working!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your talent dashboard is now working correctly.</p>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User Type:</strong> {user.user_type}</p>
              <p><strong>Profile Name:</strong> {profileData.name}</p>
            </div>
            
            <div className="mt-4">
              <a 
                href="/talent-dashboard" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Go to Full Dashboard
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentDashboardWorking;
