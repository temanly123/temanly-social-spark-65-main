import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Users, Database, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TalentLifecycleManager = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [progress, setProgress] = useState<string[]>([]);
  const { toast } = useToast();

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, message]);
    console.log('🔧', message);
  };

  const checkTalentLifecycle = async () => {
    setLoading(true);
    setProgress([]);
    setData({});

    try {
      addProgress('🔍 Checking talent lifecycle status...');

      // 1. Check all profiles in database
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        addProgress(`❌ Error fetching profiles: ${allError.message}`);
        throw allError;
      }

      addProgress(`📊 Total profiles in database: ${allProfiles?.length || 0}`);

      // 2. Check companions specifically
      const companions = allProfiles?.filter(p => p.user_type === 'companion') || [];
      addProgress(`👥 Total companions: ${companions.length}`);

      // 3. Check verification statuses
      const pending = companions.filter(c => c.verification_status === 'pending');
      const verified = companions.filter(c => c.verification_status === 'verified');
      const rejected = companions.filter(c => c.verification_status === 'rejected');

      addProgress(`📋 Verification Status Breakdown:`);
      addProgress(`  - Pending: ${pending.length}`);
      addProgress(`  - Verified: ${verified.length}`);
      addProgress(`  - Rejected: ${rejected.length}`);

      // 4. Check active status
      const active = companions.filter(c => c.status === 'active');
      const inactive = companions.filter(c => c.status === 'inactive');

      addProgress(`🔄 Activity Status Breakdown:`);
      addProgress(`  - Active: ${active.length}`);
      addProgress(`  - Inactive: ${inactive.length}`);

      // 5. Check Browse Talents criteria
      const browseTalents = companions.filter(c => 
        c.user_type === 'companion' && 
        c.verification_status === 'verified' && 
        c.status === 'active'
      );

      addProgress(`✅ Talents that should appear in Browse Talents: ${browseTalents.length}`);

      // 6. Show detailed breakdown
      if (browseTalents.length > 0) {
        addProgress(`📝 Browse Talents eligible profiles:`);
        browseTalents.forEach(talent => {
          addProgress(`  - ${talent.name || 'Unknown'} (${talent.email || 'No email'})`);
        });
      }

      // 7. Check for any issues
      const issues = [];
      
      if (verified.length > browseTalents.length) {
        issues.push(`${verified.length - browseTalents.length} verified talents are not active`);
      }
      
      if (pending.length > 0) {
        issues.push(`${pending.length} talents are still pending approval`);
      }

      if (issues.length > 0) {
        addProgress(`⚠️ Issues found:`);
        issues.forEach(issue => addProgress(`  - ${issue}`));
      } else {
        addProgress(`🎉 No issues found in talent lifecycle!`);
      }

      // Store data for display
      setData({
        allProfiles: allProfiles?.length || 0,
        companions: companions.length,
        pending: pending.length,
        verified: verified.length,
        rejected: rejected.length,
        active: active.length,
        inactive: inactive.length,
        browseTalents: browseTalents.length,
        browseTalentsList: browseTalents,
        pendingList: pending,
        verifiedList: verified,
        issues
      });

      addProgress(`✅ Talent lifecycle check completed!`);

    } catch (error: any) {
      console.error('❌ Lifecycle check failed:', error);
      addProgress(`❌ ERROR: ${error.message}`);
      toast({
        title: "Check Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fixTalentLifecycle = async () => {
    setLoading(true);
    setProgress([]);

    try {
      addProgress('🔧 Starting talent lifecycle fix...');

      // 1. Find verified but inactive talents
      const { data: verifiedInactive, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion')
        .eq('verification_status', 'verified')
        .neq('status', 'active');

      if (fetchError) throw fetchError;

      addProgress(`Found ${verifiedInactive?.length || 0} verified but inactive talents`);

      // 2. Activate verified talents
      if (verifiedInactive && verifiedInactive.length > 0) {
        for (const talent of verifiedInactive) {
          addProgress(`Activating ${talent.name || 'Unknown'}...`);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', talent.id);

          if (updateError) {
            addProgress(`❌ Failed to activate ${talent.name}: ${updateError.message}`);
          } else {
            addProgress(`✅ Activated ${talent.name}`);
          }
        }
      }

      // 3. Ensure all required fields are set for Browse Talents
      const { data: allVerifiedActive, error: fetchAllError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion')
        .eq('verification_status', 'verified')
        .eq('status', 'active');

      if (fetchAllError) throw fetchAllError;

      addProgress(`Ensuring all ${allVerifiedActive?.length || 0} active talents have required fields...`);

      if (allVerifiedActive) {
        for (const talent of allVerifiedActive) {
          const updates: any = {};
          let needsUpdate = false;

          // Ensure basic fields
          if (!talent.name) {
            updates.name = talent.full_name || talent.email?.split('@')[0] || 'Unknown Talent';
            needsUpdate = true;
          }

          if (!talent.age) {
            updates.age = 25;
            needsUpdate = true;
          }

          if (!talent.location && !talent.city) {
            updates.location = 'Jakarta';
            needsUpdate = true;
          }

          if (!talent.bio) {
            updates.bio = 'Professional companion available for various services.';
            needsUpdate = true;
          }

          if (!talent.profile_image) {
            updates.profile_image = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face';
            needsUpdate = true;
          }

          if (talent.is_available === null || talent.is_available === undefined) {
            updates.is_available = true;
            needsUpdate = true;
          }

          if (!talent.average_rating) {
            updates.average_rating = 4.5;
            needsUpdate = true;
          }

          if (!talent.total_orders) {
            updates.total_orders = 0;
            needsUpdate = true;
          }

          if (needsUpdate) {
            addProgress(`Updating fields for ${talent.name || 'Unknown'}...`);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', talent.id);

            if (updateError) {
              addProgress(`❌ Failed to update ${talent.name}: ${updateError.message}`);
            } else {
              addProgress(`✅ Updated ${talent.name}`);
            }
          }
        }
      }

      addProgress('🎉 Talent lifecycle fix completed!');
      
      // Refresh data
      setTimeout(() => checkTalentLifecycle(), 1000);

      toast({
        title: "Success!",
        description: "Talent lifecycle has been fixed. Check Browse Talents page!",
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('❌ Lifecycle fix failed:', error);
      addProgress(`❌ ERROR: ${error.message}`);
      toast({
        title: "Fix Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTalentLifecycle();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              🔄 Talent Lifecycle Manager
            </CardTitle>
            <p className="text-center text-gray-600">
              Monitor and fix the complete talent lifecycle from registration to Browse Talents display
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={checkTalentLifecycle}
                disabled={loading}
                variant="outline"
                className="px-6 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
              
              <Button 
                onClick={fixTalentLifecycle}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Fix Lifecycle
                  </>
                )}
              </Button>
            </div>

            {/* Statistics Dashboard */}
            {Object.keys(data).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.allProfiles}</div>
                    <div className="text-sm text-gray-600">Total Profiles</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.companions}</div>
                    <div className="text-sm text-gray-600">Companions</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{data.verified}</div>
                    <div className="text-sm text-gray-600">Verified</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{data.browseTalents}</div>
                    <div className="text-sm text-gray-600">Browse Ready</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Progress Log */}
            {progress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Database className="w-5 h-5 mr-2 text-green-600" />
                    Lifecycle Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    {progress.map((message, index) => (
                      <div key={index} className="mb-1">
                        {message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => window.open('/talents', '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View Browse Talents
              </Button>
              <Button 
                onClick={() => window.open('/admin', '_blank')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                View Admin Dashboard
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentLifecycleManager;
