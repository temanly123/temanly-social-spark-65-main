import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ProfileDebugger: React.FC = () => {
  const { user, switchUserType } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email);

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "Failed to fetch profiles",
          variant: "destructive"
        });
      } else {
        setProfiles(data || []);
        console.log('Profiles found:', data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTalentProfile = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Create a basic talent profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: user.email,
          name: user.name,
          user_type: 'companion',
          status: 'pending',
          verification_status: 'pending',
          phone: user.phone || '',
          age: 25,
          location: 'Jakarta',
          bio: 'New talent on Temanly',
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating talent profile:', error);
        toast({
          title: "Error",
          description: "Failed to create talent profile: " + error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Talent profile created successfully!",
        });
        fetchProfiles(); // Refresh the profiles
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSwitchToTalent = async () => {
    setLoading(true);
    try {
      console.log('Testing switch to talent...');
      const success = await switchUserType('companion');

      if (success) {
        toast({
          title: "Switch Successful!",
          description: "Successfully switched to talent account. Redirecting...",
        });

        // Wait a moment then navigate
        setTimeout(() => {
          navigate('/talent-dashboard');
        }, 1000);
      } else {
        toast({
          title: "Switch Failed",
          description: "Unable to switch to talent account. Check console for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Switch error:', error);
      toast({
        title: "Switch Error",
        description: "An error occurred while switching accounts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    // Force a page refresh to reset all states
    window.location.reload();
  };

  useEffect(() => {
    fetchProfiles();
  }, [user?.email]);

  if (!user) {
    return <div>Please log in to see profile debug info</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Current User:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Profiles for {user.email}:</h3>
            <Button onClick={fetchProfiles} disabled={loading} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div>Loading...</div>
          ) : profiles.length === 0 ? (
            <div className="text-gray-500">No profiles found</div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>ID:</strong> {profile.id}</div>
                    <div><strong>User Type:</strong> {profile.user_type}</div>
                    <div><strong>Status:</strong> {profile.status}</div>
                    <div><strong>Verification:</strong> {profile.verification_status}</div>
                    <div><strong>Name:</strong> {profile.name}</div>
                    <div><strong>Email:</strong> {profile.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Actions:</h3>
          <div className="space-y-2">
            <div className="space-x-2">
              <Button
                onClick={createTalentProfile}
                disabled={loading || profiles.some(p => p.user_type === 'companion')}
              >
                Create Talent Profile
              </Button>

              {profiles.some(p => p.user_type === 'companion') && (
                <>
                  <Button
                    onClick={testSwitchToTalent}
                    disabled={loading}
                    variant="outline"
                  >
                    Test Switch to Talent Dashboard
                  </Button>
                  <Button
                    onClick={forceRefresh}
                    disabled={loading}
                    variant="secondary"
                    size="sm"
                  >
                    Refresh Page
                  </Button>
                </>
              )}
            </div>

            {profiles.some(p => p.user_type === 'companion') && (
              <div className="text-green-600 text-sm">
                ✅ Talent profile exists! You should be able to switch to talent dashboard.
                <br />
                <span className="text-orange-600">
                  If you don't see "Switch to Talent Dashboard" in the header menu, try refreshing the page.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileDebugger;
