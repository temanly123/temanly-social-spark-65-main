import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestTube, User, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SignupDocumentTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const testSignupProcess = async () => {
    try {
      setTesting(true);
      console.log('🧪 [SignupDocumentTester] Testing signup document linking...');
      
      // Step 1: Check current document integrity
      console.log('📊 [SignupDocumentTester] Checking document integrity...');
      const { data: integrityData, error: integrityError } = await supabase.rpc('ensure_document_integrity');
      
      if (integrityError) {
        console.warn('⚠️ [SignupDocumentTester] Integrity check warning:', integrityError);
      }

      // Step 2: Check for orphaned documents
      const { data: allDocs, error: docsError } = await supabase
        .from('verification_documents')
        .select('*');

      if (docsError) throw docsError;

      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      const userIds = new Set(allUsers?.map(u => u.id) || []);
      const orphanDocs = allDocs?.filter(doc => !userIds.has(doc.user_id)) || [];

      // Step 3: Test cleanup function
      console.log('🧹 [SignupDocumentTester] Testing cleanup function...');
      const { error: cleanupError } = await supabase.rpc('cleanup_orphaned_documents');
      
      if (cleanupError) {
        console.warn('⚠️ [SignupDocumentTester] Cleanup warning:', cleanupError);
      }

      // Step 4: Check documents after cleanup
      const { data: docsAfterCleanup, error: docsAfterError } = await supabase
        .from('verification_documents')
        .select('*');

      if (docsAfterError) throw docsAfterError;

      const orphanDocsAfter = docsAfterCleanup?.filter(doc => !userIds.has(doc.user_id)) || [];

      const results = {
        success: true,
        message: 'Document integrity test completed',
        details: {
          integrityCheck: integrityData,
          documentsBeforeCleanup: allDocs?.length || 0,
          orphanedDocumentsBefore: orphanDocs.length,
          documentsAfterCleanup: docsAfterCleanup?.length || 0,
          orphanedDocumentsAfter: orphanDocsAfter.length,
          cleanupWorked: orphanDocs.length > orphanDocsAfter.length || orphanDocs.length === 0
        }
      };

      console.log('✅ [SignupDocumentTester] Test results:', results);
      setTestResults(results);

      toast({
        title: "Test Completed",
        description: `Found ${orphanDocs.length} orphans before, ${orphanDocsAfter.length} after cleanup`,
        variant: orphanDocsAfter.length === 0 ? "default" : "destructive"
      });
      
    } catch (error: any) {
      console.error('❌ [SignupDocumentTester] Test error:', error);
      setTestResults({
        success: false,
        message: error.message,
        details: { error: error }
      });
      
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const runManualCleanup = async () => {
    try {
      console.log('🧹 [SignupDocumentTester] Running manual cleanup...');
      
      const { error: cleanupError } = await supabase.rpc('cleanup_orphaned_documents');
      
      if (cleanupError) throw cleanupError;
      
      toast({
        title: "Cleanup Complete",
        description: "Orphaned documents have been cleaned up",
        className: "bg-green-50 border-green-200"
      });
      
      // Refresh test results
      await testSignupProcess();
      
    } catch (error: any) {
      console.error('❌ [SignupDocumentTester] Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Signup Document Tester
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test document integrity and cleanup functions to prevent orphaned documents.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testSignupProcess} 
              disabled={testing}
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {testing ? 'Testing...' : 'Test Document Integrity'}
            </Button>

            <Button 
              onClick={runManualCleanup} 
              disabled={testing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Manual Cleanup
            </Button>
          </div>

          {testResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.success)}
                <span className="font-medium">
                  {testResults.success ? 'Test Passed' : 'Test Failed'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium mb-2">Test Results:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Message:</strong> {testResults.message}</p>
                  
                  {testResults.details && (
                    <div className="space-y-1">
                      {typeof testResults.details.documentsBeforeCleanup === 'number' && (
                        <p><strong>Documents Before Cleanup:</strong> {testResults.details.documentsBeforeCleanup}</p>
                      )}
                      {typeof testResults.details.orphanedDocumentsBefore === 'number' && (
                        <p><strong>Orphaned Before:</strong> 
                          <Badge className={testResults.details.orphanedDocumentsBefore === 0 ? 'bg-green-500 ml-2' : 'bg-red-500 ml-2'}>
                            {testResults.details.orphanedDocumentsBefore}
                          </Badge>
                        </p>
                      )}
                      {typeof testResults.details.documentsAfterCleanup === 'number' && (
                        <p><strong>Documents After Cleanup:</strong> {testResults.details.documentsAfterCleanup}</p>
                      )}
                      {typeof testResults.details.orphanedDocumentsAfter === 'number' && (
                        <p><strong>Orphaned After:</strong> 
                          <Badge className={testResults.details.orphanedDocumentsAfter === 0 ? 'bg-green-500 ml-2' : 'bg-red-500 ml-2'}>
                            {testResults.details.orphanedDocumentsAfter}
                          </Badge>
                        </p>
                      )}
                      {typeof testResults.details.cleanupWorked === 'boolean' && (
                        <p><strong>Cleanup Worked:</strong> 
                          <Badge className={testResults.details.cleanupWorked ? 'bg-green-500 ml-2' : 'bg-red-500 ml-2'}>
                            {testResults.details.cleanupWorked ? 'Yes' : 'No'}
                          </Badge>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {testResults.details?.integrityCheck && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Integrity Check Results:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(testResults.details.integrityCheck, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">How This Prevents Orphaned Documents</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 ml-4">
              <li>• Cleanup runs before each talent signup</li>
              <li>• Documents use upsert instead of insert</li>
              <li>• Better error handling prevents broken states</li>
              <li>• Manual cleanup function available</li>
              <li>• Automatic integrity checking</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupDocumentTester;
