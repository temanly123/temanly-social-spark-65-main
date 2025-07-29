import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const UserProfileDebug: React.FC = () => {
  const { user, switchUserType } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    if (!user?.id && !user?.email) return;

    setLoading(true);
    try {
      // Try both ID and email queries
      const queries = [];
      
      if (user.id) {
        queries.push(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
        );
      }
      
      if (user.email) {
        queries.push(
          supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
        );
      }

      const results = await Promise.all(queries);
      const allProfiles = results.flatMap(result => result.data || []);
      
      // Remove duplicates based on ID
      const uniqueProfiles = allProfiles.filter((profile, index, self) => 
        index === self.findIndex(p => p.id === profile.id)
      );
      
      setProfiles(uniqueProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user?.id, user?.email]);

  const handleSwitch = async (targetType: 'user' | 'companion') => {
    const success = await switchUserType(targetType);
    if (success) {
      console.log('Switch successful');
    } else {
      console.log('Switch failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current User State:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Available Profiles:</h3>
            <Button onClick={fetchProfiles} disabled={loading} className="mb-3">
              {loading ? 'Loading...' : 'Refresh Profiles'}
            </Button>
            
            {profiles.length > 0 ? (
              <div className="space-y-3">
                {profiles.map((profile, index) => (
                  <div key={profile.id || index} className="border p-3 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">Type: {profile.user_type}</span>
                        <span className="ml-3 text-sm text-gray-600">Status: {profile.status}</span>
                        <span className="ml-3 text-sm text-gray-600">Verification: {profile.verification_status}</span>
                      </div>
                      <div className="space-x-2">
                        {profile.user_type !== user?.user_type && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSwitch(profile.user_type)}
                          >
                            Switch to {profile.user_type}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>ID: {profile.id}</div>
                      <div>Email: {profile.email}</div>
                      <div>Name: {profile.name || profile.full_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No profiles found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileDebug;
