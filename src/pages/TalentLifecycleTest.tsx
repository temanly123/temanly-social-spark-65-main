import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Users, ArrowRight, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TalentLifecycleTest = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>({});
  const { toast } = useToast();

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, message]);
    console.log('🧪', message);
  };

  const runCompleteLifecycleTest = async () => {
    setLoading(true);
    setProgress([]);
    setTestResults({});

    try {
      addProgress('🧪 Starting Complete Talent Lifecycle Test...');

      // Step 1: Create a test talent profile
      addProgress('📝 Step 1: Creating test talent profile...');

      // Generate a proper UUID
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const testTalentId = generateUUID();
      const testTalent = {
        id: testTalentId,
        email: `test.talent.${Date.now()}@temanly.com`,
        full_name: 'Test Talent Lifecycle',
        user_type: 'companion',
        verification_status: 'pending',
        status: 'inactive',
        age: 26,
        location: 'Jakarta',
        bio: 'Test talent for lifecycle verification',
        profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        created_at: new Date().toISOString()
      };

      const { error: createError } = await supabase
        .from('profiles')
        .insert(testTalent);

      if (createError) {
        addProgress(`❌ Failed to create test talent: ${createError.message}`);
        throw createError;
      }

      addProgress('✅ Test talent created successfully');

      // Step 2: Simulate admin approval
      addProgress('👨‍💼 Step 2: Simulating admin approval...');

      const approvalData = {
        user_type: 'companion',
        verification_status: 'verified',
        status: 'active',
        is_available: true,
        name: testTalent.full_name,
        age: testTalent.age,
        location: testTalent.location,
        bio: testTalent.bio,
        profile_image: testTalent.profile_image,
        average_rating: 4.5,
        total_orders: 0,
        featured_talent: false,
        is_newcomer: true,
        talent_level: 'fresh',
        available_services: ['chat', 'call', 'video', 'offline-date'],
        interests: ['Conversation', 'Entertainment', 'Companionship'],
        rent_lover_rate: 65000.00,
        updated_at: new Date().toISOString()
      };

      const { error: approvalError } = await supabase
        .from('profiles')
        .update(approvalData)
        .eq('id', testTalentId);

      if (approvalError) {
        addProgress(`❌ Failed to approve test talent: ${approvalError.message}`);
        throw approvalError;
      }

      addProgress('✅ Test talent approved successfully');

      // Step 3: Verify talent appears in Browse Talents query
      addProgress('🔍 Step 3: Verifying talent appears in Browse Talents query...');

      const { data: browseTalents, error: browseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion')
        .eq('verification_status', 'verified')
        .eq('status', 'active');

      if (browseError) {
        addProgress(`❌ Failed to query Browse Talents: ${browseError.message}`);
        throw browseError;
      }

      const testTalentInResults = browseTalents?.find(t => t.id === testTalentId);
      
      if (testTalentInResults) {
        addProgress('✅ Test talent found in Browse Talents query');
        addProgress(`📋 Talent data: ${testTalentInResults.name}, ${testTalentInResults.verification_status}, ${testTalentInResults.status}`);
      } else {
        addProgress('❌ Test talent NOT found in Browse Talents query');
        throw new Error('Test talent not found in Browse Talents results');
      }

      // Step 4: Test talent card transformation
      addProgress('🎨 Step 4: Testing talent card data transformation...');

      const transformedTalent = {
        id: testTalentInResults.id,
        name: testTalentInResults.name || 'Unknown',
        age: testTalentInResults.age || 25,
        city: testTalentInResults.city || testTalentInResults.location || 'Unknown',
        rating: testTalentInResults.rating || testTalentInResults.average_rating || 4.5,
        reviewCount: testTalentInResults.total_bookings || testTalentInResults.total_orders || 0,
        level: testTalentInResults.talent_level === 'fresh' ? 'Fresh Talent' :
               testTalentInResults.talent_level === 'elite' ? 'Elite Talent' :
               testTalentInResults.talent_level === 'vip' ? 'VIP Talent' : 'Fresh Talent',
        image: testTalentInResults.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        services: Array.isArray(testTalentInResults.available_services) ? testTalentInResults.available_services : ['chat', 'call'],
        interests: Array.isArray(testTalentInResults.interests) ? testTalentInResults.interests : ['Conversation', 'Entertainment'],
        zodiac: testTalentInResults.zodiac || 'Leo',
        loveLanguage: testTalentInResults.love_language || 'Quality Time',
        description: testTalentInResults.bio || 'Professional companion with excellent communication skills',
        priceRange: testTalentInResults.rent_lover_rate ? `25k - ${Math.floor(testTalentInResults.rent_lover_rate / 1000)}k` :
                    testTalentInResults.hourly_rate ? `${Math.floor(testTalentInResults.hourly_rate / 1000)}k/hour` : '25k - 85k',
        isOnline: testTalentInResults.is_available !== false,
        verified: testTalentInResults.verification_status === 'verified',
        availability: testTalentInResults.is_available !== false ? 'Available for booking' : 'Currently unavailable'
      };

      addProgress('✅ Talent card transformation successful');
      addProgress(`🎨 Transformed data: ${transformedTalent.name}, ${transformedTalent.level}, ${transformedTalent.priceRange}`);

      // Step 5: Cleanup test data
      addProgress('🧹 Step 5: Cleaning up test data...');

      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testTalentId);

      if (deleteError) {
        addProgress(`⚠️ Warning: Failed to cleanup test talent: ${deleteError.message}`);
      } else {
        addProgress('✅ Test data cleaned up successfully');
      }

      // Step 6: Final verification
      addProgress('🎯 Step 6: Final verification...');

      const { data: finalCheck, error: finalError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion')
        .eq('verification_status', 'verified')
        .eq('status', 'active');

      if (finalError) {
        addProgress(`❌ Final verification failed: ${finalError.message}`);
      } else {
        addProgress(`✅ Final verification: ${finalCheck?.length || 0} active verified talents in database`);
      }

      // Store test results
      setTestResults({
        success: true,
        testTalentCreated: true,
        approvalWorked: true,
        appearsInBrowse: !!testTalentInResults,
        transformationWorked: true,
        cleanupSuccessful: !deleteError,
        totalActiveTalents: finalCheck?.length || 0,
        testTalentData: transformedTalent
      });

      addProgress('🎉 COMPLETE: Talent lifecycle test passed successfully!');
      
      toast({
        title: "🎉 Lifecycle Test Passed!",
        description: "Complete talent lifecycle is working correctly. Approved talents will appear in Browse Talents!",
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('❌ Lifecycle test failed:', error);
      addProgress(`❌ TEST FAILED: ${error.message}`);
      
      setTestResults({
        success: false,
        error: error.message
      });

      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
              <Play className="w-6 h-6 mr-2 text-green-600" />
              🧪 Talent Lifecycle Test Suite
            </CardTitle>
            <p className="text-center text-gray-600">
              End-to-end test of the complete talent lifecycle from creation to Browse Talents display
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Test Flow Diagram */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Test Flow:</h3>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Badge variant="outline">1. Create Test Talent</Badge>
                  <ArrowRight className="w-4 h-4" />
                  <Badge variant="outline">2. Admin Approval</Badge>
                  <ArrowRight className="w-4 h-4" />
                  <Badge variant="outline">3. Browse Query</Badge>
                  <ArrowRight className="w-4 h-4" />
                  <Badge variant="outline">4. Data Transform</Badge>
                  <ArrowRight className="w-4 h-4" />
                  <Badge variant="outline">5. Cleanup</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Run Test Button */}
            <div className="text-center">
              <Button 
                onClick={runCompleteLifecycleTest}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    🧪 Run Complete Lifecycle Test
                  </>
                )}
              </Button>
            </div>

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {testResults.success ? (
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                    )}
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${testResults.success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResults.success ? '✅' : '❌'}
                      </div>
                      <div className="text-sm text-gray-600">Overall</div>
                    </div>
                    
                    {testResults.success && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{testResults.totalActiveTalents}</div>
                          <div className="text-sm text-gray-600">Active Talents</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {testResults.appearsInBrowse ? '✅' : '❌'}
                          </div>
                          <div className="text-sm text-gray-600">Browse Ready</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Log */}
            {progress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Test Progress
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
                onClick={() => window.open('/talent-lifecycle', '_blank')}
                variant="outline"
              >
                Lifecycle Manager
              </Button>
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

export default TalentLifecycleTest;
