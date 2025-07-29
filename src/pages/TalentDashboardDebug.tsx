import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TalentDashboardDebug = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Get auth user
        const { data: authData } = await supabase.auth.getUser();
        setAuthUser(authData.user);

        // Get all profiles for this email
        if (authData.user?.email) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authData.user.email);
          
          setProfiles(profilesData || []);
        }

        // Get localStorage info
        const persistedProfile = localStorage.getItem('selectedProfile');
        
        setDebugInfo({
          currentPath: window.location.pathname,
          persistedProfile: persistedProfile ? JSON.parse(persistedProfile) : null,
          localStorage: {
            selectedProfile: persistedProfile
          }
        });

      } catch (error) {
        console.error('Debug fetch error:', error);
      }
    };

    fetchDebugInfo();
  }, []);

  const switchToCompanion = async () => {
    const companionProfile = profiles.find(p => p.user_type === 'companion');
    if (companionProfile) {
      const profileSelection = {
        profileId: companionProfile.id,
        userType: 'companion',
        email: companionProfile.email
      };
      localStorage.setItem('selectedProfile', JSON.stringify(profileSelection));
      window.location.reload();
    }
  };

  const createCompanionProfile = async () => {
    if (!authUser?.email) return;

    try {
      // Generate a unique ID for the companion profile
      const companionId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: companionId,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || 'Companion',
          full_name: authUser.user_metadata?.full_name || 'Companion',
          user_type: 'companion',
          verification_status: 'verified',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Set the new companion profile as selected
      const profileSelection = {
        profileId: companionId,
        userType: 'companion',
        email: authUser.email
      };
      localStorage.setItem('selectedProfile', JSON.stringify(profileSelection));

      alert('Companion profile created! Redirecting to talent dashboard...');
      window.location.href = '/talent-dashboard';
    } catch (error) {
      console.error('Error creating companion profile:', error);
      alert('Error creating companion profile: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Talent Dashboard Debug</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Current User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth User Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(authUser, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Profiles for Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profiles.length === 0 ? (
                <p>No profiles found</p>
              ) : (
                profiles.map((profile, index) => (
                  <div key={index} className="border p-4 rounded">
                    <p><strong>ID:</strong> {profile.id}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Name:</strong> {profile.name}</p>
                    <p><strong>User Type:</strong> {profile.user_type}</p>
                    <p><strong>Status:</strong> {profile.status}</p>
                    <p><strong>Verification:</strong> {profile.verification_status}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profiles.find(p => p.user_type === 'companion') ? (
              <Button onClick={switchToCompanion}>
                Switch to Companion Profile
              </Button>
            ) : (
              <Button onClick={createCompanionProfile}>
                Create Companion Profile
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/talent-dashboard'}
            >
              Go to Talent Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentDashboardDebug;
