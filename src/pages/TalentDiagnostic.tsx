import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TalentDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [companionProfiles, setCompanionProfiles] = useState<any[]>([]);
  const { toast } = useToast();

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, message]);
    console.log('🔍', message);
  };

  const runDetailedDiagnostic = async () => {
    setLoading(true);
    setProgress([]);
    setAllProfiles([]);
    setCompanionProfiles([]);

    try {
      addProgress('🔍 Running detailed talent diagnostic...');

      // 1. Get ALL profiles to see what's in the database
      addProgress('📊 Step 1: Fetching all profiles from database...');
      
      const { data: allProfilesData, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        addProgress(`❌ Error fetching all profiles: ${allError.message}`);
        throw allError;
      }

      addProgress(`📋 Found ${allProfilesData?.length || 0} total profiles in database`);
      setAllProfiles(allProfilesData || []);

      // 2. Show breakdown by user_type
      const userTypes = {};
      allProfilesData?.forEach(profile => {
        const type = profile.user_type || 'null';
        userTypes[type] = (userTypes[type] || 0) + 1;
      });

      addProgress('👥 User type breakdown:');
      Object.entries(userTypes).forEach(([type, count]) => {
        addProgress(`  - ${type}: ${count}`);
      });

      // 3. Focus on companions
      const companions = allProfilesData?.filter(p => p.user_type === 'companion') || [];
      addProgress(`🎭 Found ${companions.length} companions`);
      setCompanionProfiles(companions);

      if (companions.length > 0) {
        addProgress('🔍 Companion details:');
        companions.forEach((companion, index) => {
          addProgress(`  ${index + 1}. ${companion.name || companion.full_name || 'No name'}`);
          addProgress(`     - ID: ${companion.id}`);
          addProgress(`     - Email: ${companion.email || 'No email'}`);
          addProgress(`     - User Type: ${companion.user_type}`);
          addProgress(`     - Verification: ${companion.verification_status}`);
          addProgress(`     - Status: ${companion.status}`);
          addProgress(`     - Available: ${companion.is_available}`);
          addProgress(`     - Created: ${new Date(companion.created_at).toLocaleString()}`);
          addProgress('     ---');
        });
      }

      // 4. Check Browse Talents criteria specifically
      addProgress('🎯 Checking Browse Talents criteria...');
      
      const browseCriteria = companions.filter(c => 
        c.user_type === 'companion' && 
        c.verification_status === 'verified' && 
        c.status === 'active'
      );

      addProgress(`✅ Talents meeting Browse Talents criteria: ${browseCriteria.length}`);

      if (browseCriteria.length > 0) {
        addProgress('🎉 These talents should appear in Browse Talents:');
        browseCriteria.forEach((talent, index) => {
          addProgress(`  ${index + 1}. ${talent.name || talent.full_name || 'No name'} (${talent.email})`);
        });
      } else {
        addProgress('❌ NO talents meet Browse Talents criteria!');
        
        // Analyze why
        const verified = companions.filter(c => c.verification_status === 'verified');
        const active = companions.filter(c => c.status === 'active');
        
        addProgress('🔍 Analysis:');
        addProgress(`  - Companions: ${companions.length}`);
        addProgress(`  - Verified: ${verified.length}`);
        addProgress(`  - Active: ${active.length}`);
        
        if (verified.length > 0 && active.length === 0) {
          addProgress('⚠️ Issue: Verified talents are not active!');
        } else if (verified.length === 0) {
          addProgress('⚠️ Issue: No verified talents found!');
        }
      }

      // 5. Test the exact Browse Talents query
      addProgress('🔍 Testing exact Browse Talents query...');
      
      const { data: browseQuery, error: browseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion')
        .eq('verification_status', 'verified')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (browseError) {
        addProgress(`❌ Browse Talents query failed: ${browseError.message}`);
      } else {
        addProgress(`📊 Browse Talents query returned: ${browseQuery?.length || 0} results`);
        
        if (browseQuery && browseQuery.length > 0) {
          addProgress('✅ Query results:');
          browseQuery.forEach((talent, index) => {
            addProgress(`  ${index + 1}. ${talent.name || 'No name'} - ${talent.email}`);
          });
        }
      }

      addProgress('🎉 Diagnostic completed!');

    } catch (error: any) {
      console.error('❌ Diagnostic failed:', error);
      addProgress(`❌ ERROR: ${error.message}`);
      toast({
        title: "Diagnostic Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fixAllCompanions = async () => {
    setLoading(true);
    setProgress([]);

    try {
      addProgress('🔧 Fixing all companion profiles...');

      // Get all companions
      const { data: companions, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion');

      if (fetchError) throw fetchError;

      addProgress(`Found ${companions?.length || 0} companions to fix`);

      if (companions && companions.length > 0) {
        for (const companion of companions) {
          addProgress(`🔧 Fixing ${companion.name || companion.email || 'Unknown'}...`);

          const updates: any = {
            user_type: 'companion',
            updated_at: new Date().toISOString()
          };

          // If verified but not active, make active
          if (companion.verification_status === 'verified' && companion.status !== 'active') {
            updates.status = 'active';
            addProgress(`  - Setting status to active`);
          }

          // Ensure required fields
          if (!companion.name && companion.full_name) {
            updates.name = companion.full_name;
            addProgress(`  - Setting name from full_name`);
          }

          if (!companion.name && !companion.full_name && companion.email) {
            updates.name = companion.email.split('@')[0];
            addProgress(`  - Setting name from email`);
          }

          if (!companion.age) {
            updates.age = 25;
            addProgress(`  - Setting default age`);
          }

          if (!companion.location && !companion.city) {
            updates.location = 'Jakarta';
            addProgress(`  - Setting default location`);
          }

          if (!companion.bio) {
            updates.bio = 'Professional companion available for various services.';
            addProgress(`  - Setting default bio`);
          }

          if (!companion.profile_image) {
            updates.profile_image = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face';
            addProgress(`  - Setting default profile image`);
          }

          if (companion.is_available === null || companion.is_available === undefined) {
            updates.is_available = true;
            addProgress(`  - Setting available to true`);
          }

          // DO NOT set fake ratings - let ratings be calculated from real reviews only
          // if (!companion.average_rating) {
          //   updates.average_rating = 4.5;
          //   addProgress(`  - Setting default rating`);
          // }

          if (!companion.total_orders) {
            updates.total_orders = 0;
            addProgress(`  - Setting default order count`);
          }

          // Apply updates
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', companion.id);

          if (updateError) {
            addProgress(`❌ Failed to update ${companion.name || 'Unknown'}: ${updateError.message}`);
          } else {
            addProgress(`✅ Updated ${companion.name || companion.email || 'Unknown'}`);
          }
        }
      }

      addProgress('🎉 All companions fixed! Running diagnostic again...');
      
      // Run diagnostic again to see results
      setTimeout(() => runDetailedDiagnostic(), 1000);

      toast({
        title: "Success!",
        description: "All companions have been fixed. Check Browse Talents now!",
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('❌ Fix failed:', error);
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
    runDetailedDiagnostic();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
              <Search className="w-6 h-6 mr-2 text-purple-600" />
              🔍 Talent Database Diagnostic
            </CardTitle>
            <p className="text-center text-gray-600">
              Deep dive into what's actually in your database and why talents might not be showing
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={runDetailedDiagnostic}
                disabled={loading}
                variant="outline"
                className="px-6 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    🔍 Run Diagnostic
                  </>
                )}
              </Button>
              
              <Button 
                onClick={fixAllCompanions}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    🔧 Fix All Companions
                  </>
                )}
              </Button>
            </div>

            {/* Summary Stats */}
            {allProfiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{allProfiles.length}</div>
                    <div className="text-sm text-gray-600">Total Profiles</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{companionProfiles.length}</div>
                    <div className="text-sm text-gray-600">Companions</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {companionProfiles.filter(c => c.verification_status === 'verified').length}
                    </div>
                    <div className="text-sm text-gray-600">Verified</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {companionProfiles.filter(c => 
                        c.user_type === 'companion' && 
                        c.verification_status === 'verified' && 
                        c.status === 'active'
                      ).length}
                    </div>
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
                    Diagnostic Results
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
              <Button 
                onClick={() => window.open('/talent-lifecycle-test', '_blank')}
                variant="outline"
              >
                Run Lifecycle Test
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentDiagnostic;
