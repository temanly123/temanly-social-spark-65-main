import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';

const DatabaseDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      console.log('🔍 [DatabaseDiagnostic] Starting comprehensive database diagnostic...');

      const results: any = {
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Check table structure
      console.log('📋 [DatabaseDiagnostic] Checking table structure...');
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from('verification_documents')
          .select('*')
          .limit(1);

        results.tests.tableStructure = {
          success: !tableError,
          error: tableError?.message,
          hasData: tableInfo && tableInfo.length > 0
        };
      } catch (error: any) {
        results.tests.tableStructure = {
          success: false,
          error: error.message
        };
      }

      // Test 2: Check RLS status (simplified)
      console.log('🔒 [DatabaseDiagnostic] Checking RLS status...');
      try {
        // Try a simple query to see if RLS is blocking us
        const { data: rlsTest, error: rlsError } = await supabase
          .from('verification_documents')
          .select('count')
          .limit(1);

        results.tests.rlsStatus = {
          success: !rlsError,
          data: rlsError ? 'RLS may be blocking access' : 'RLS allows access',
          error: rlsError?.message
        };
      } catch (error: any) {
        results.tests.rlsStatus = {
          success: false,
          error: error.message
        };
      }

      // Test 3: Try simple insert
      console.log('💾 [DatabaseDiagnostic] Testing simple insert...');
      const testUserId = '00000000-0000-0000-0000-000000000001';
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('verification_documents')
          .insert({
            user_id: testUserId,
            document_type: 'test_diagnostic',
            document_url: 'data:text/plain;base64,dGVzdA==',
            status: 'pending',
            file_name: 'diagnostic-test.txt',
            file_size: 4,
            content_type: 'text/plain'
          })
          .select()
          .single();

        results.tests.simpleInsert = {
          success: !insertError,
          data: insertData,
          error: insertError?.message
        };

        // Clean up test data
        if (!insertError && insertData) {
          await supabase
            .from('verification_documents')
            .delete()
            .eq('id', insertData.id);
        }
      } catch (error: any) {
        results.tests.simpleInsert = {
          success: false,
          error: error.message
        };
      }

      // Test 4: Check user authentication
      console.log('👤 [DatabaseDiagnostic] Checking user authentication...');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        results.tests.userAuth = {
          success: !userError && !!user,
          userId: user?.id,
          userEmail: user?.email,
          error: userError?.message
        };
      } catch (error: any) {
        results.tests.userAuth = {
          success: false,
          error: error.message
        };
      }

      // Test 5: Check existing documents count
      console.log('📊 [DatabaseDiagnostic] Checking existing documents...');
      try {
        const { count, error: countError } = await supabase
          .from('verification_documents')
          .select('*', { count: 'exact', head: true });

        results.tests.existingDocuments = {
          success: !countError,
          count: count,
          error: countError?.message
        };
      } catch (error: any) {
        results.tests.existingDocuments = {
          success: false,
          error: error.message
        };
      }

      // Test 6: Check specific user documents (Amanda's)
      console.log('🔍 [DatabaseDiagnostic] Checking Amanda\'s documents...');
      try {
        const { data: amandaDocs, error: amandaError } = await supabase
          .from('verification_documents')
          .select('*')
          .eq('user_id', 'angela.soenoko@gmail.com'); // Try email first

        if (amandaError || !amandaDocs || amandaDocs.length === 0) {
          // Try with actual user ID from profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', 'angela.soenoko@gmail.com')
            .single();

          if (profileData) {
            const { data: amandaDocsById, error: amandaByIdError } = await supabase
              .from('verification_documents')
              .select('*')
              .eq('user_id', profileData.id);

            results.tests.amandaDocuments = {
              success: !amandaByIdError,
              data: amandaDocsById,
              profileId: profileData.id,
              error: amandaByIdError?.message
            };
          } else {
            results.tests.amandaDocuments = {
              success: false,
              error: 'Could not find Amanda\'s profile'
            };
          }
        } else {
          results.tests.amandaDocuments = {
            success: true,
            data: amandaDocs
          };
        }
      } catch (error: any) {
        results.tests.amandaDocuments = {
          success: false,
          error: error.message
        };
      }

      setDiagnosticResult(results);

      const overallSuccess = Object.values(results.tests).every((test: any) => test.success);
      
      toast({
        title: overallSuccess ? "✅ Database Diagnostic Complete" : "⚠️ Database Issues Found",
        description: overallSuccess ? "All tests passed successfully" : "Some tests failed - check results below",
        variant: overallSuccess ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error('❌ [DatabaseDiagnostic] Error:', error);
      toast({
        title: "Diagnostic Failed",
        description: error.message || "Failed to run database diagnostic",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTestIcon = (test: any) => {
    if (test.success) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Diagnostic Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          {loading ? 'Running Diagnostic...' : 'Run Full Database Diagnostic'}
        </Button>

        {diagnosticResult && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Diagnostic run at: {new Date(diagnosticResult.timestamp).toLocaleString()}
            </div>

            {Object.entries(diagnosticResult.tests).map(([testName, test]: [string, any]) => (
              <div key={testName} className={`p-4 rounded border ${test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getTestIcon(test)}
                  <span className="font-semibold capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                
                {test.error && (
                  <div className="text-sm text-red-700 mb-2">
                    <strong>Error:</strong> {test.error}
                  </div>
                )}
                
                {test.data && (
                  <div className="text-sm">
                    <strong>Data:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}

                {test.count !== undefined && (
                  <div className="text-sm">
                    <strong>Count:</strong> {test.count}
                  </div>
                )}

                {test.userId && (
                  <div className="text-sm">
                    <strong>User ID:</strong> {test.userId}
                  </div>
                )}

                {test.profileId && (
                  <div className="text-sm">
                    <strong>Profile ID:</strong> {test.profileId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDiagnostic;
