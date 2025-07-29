import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Upload, Database, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StorageDebugTool = () => {
  const [status, setStatus] = useState<{
    buckets: any[];
    bucketError: string | null;
    files: any[];
    filesError: string | null;
    dbDocs: any[];
    dbError: string | null;
    testUploadResult: string | null;
  }>({
    buckets: [],
    bucketError: null,
    files: [],
    filesError: null,
    dbDocs: [],
    dbError: null,
    testUploadResult: null
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setLoading(true);
    const newStatus = { ...status };

    try {
      // 1. Check available buckets
      console.log('🔍 [Debug] Checking buckets...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      newStatus.buckets = buckets || [];
      newStatus.bucketError = bucketsError?.message || null;
      console.log('📦 [Debug] Buckets:', buckets, bucketsError);

      // 2. Check verification-documents bucket content
      if (buckets?.find(b => b.id === 'verification-documents')) {
        console.log('🔍 [Debug] Checking verification-documents bucket...');
        const { data: files, error: filesError } = await supabase.storage
          .from('verification-documents')
          .list('', { limit: 100 });
        newStatus.files = files || [];
        newStatus.filesError = filesError?.message || null;
        console.log('📄 [Debug] Files in bucket:', files, filesError);

        // Check specific folders if any
        if (files && files.length > 0) {
          for (const item of files) {
            if (!item.name.includes('.')) { // It's a folder
              const { data: folderFiles } = await supabase.storage
                .from('verification-documents')
                .list(item.name, { limit: 100 });
              console.log(`📁 [Debug] Files in ${item.name}:`, folderFiles);
            }
          }
        }
      } else {
        newStatus.filesError = 'Bucket verification-documents tidak ditemukan';
      }

      // 3. Check database records
      console.log('🔍 [Debug] Checking database...');
      const { data: dbDocs, error: dbError } = await supabase
        .from('verification_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      newStatus.dbDocs = dbDocs || [];
      newStatus.dbError = dbError?.message || null;
      console.log('🗄️ [Debug] DB documents:', dbDocs, dbError);

    } catch (error: any) {
      console.error('❌ [Debug] Error in diagnostics:', error);
      toast({
        title: "Diagnostic Error",
        description: error.message,
        variant: "destructive"
      });
    }

    setStatus(newStatus);
    setLoading(false);
  };

  const testUpload = async () => {
    try {
      setLoading(true);
      console.log('🧪 [Debug] Testing file upload...');

      // Create a simple test file
      const testContent = 'Test file content for debugging';
      const testFile = new File([testContent], 'test-debug.txt', { type: 'text/plain' });
      // Use a proper UUID format for testing
      const testUUID = '00000000-0000-0000-0000-000000000001';
      const testPath = `${testUUID}/test-file-${Date.now()}.txt`;

      // Try to upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(testPath, testFile);

      if (uploadError) {
        setStatus(prev => ({
          ...prev,
          testUploadResult: `Upload failed: ${uploadError.message}`
        }));
        return;
      }

      console.log('✅ [Debug] Test upload successful:', uploadData);

      // Try to get signed URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(testPath, 60);

      if (urlError) {
        setStatus(prev => ({
          ...prev,
          testUploadResult: `Upload OK, but signed URL failed: ${urlError.message}`
        }));
        return;
      }

      console.log('✅ [Debug] Signed URL created:', signedUrlData);

      // Try to access the file
      if (signedUrlData?.signedUrl) {
        const response = await fetch(signedUrlData.signedUrl);
        const isAccessible = response.ok;
        
        setStatus(prev => ({
          ...prev,
          testUploadResult: `Upload: ✅, Signed URL: ✅, Accessible: ${isAccessible ? '✅' : '❌'}`
        }));
      }

      // Clean up test file
      await supabase.storage
        .from('verification-documents')
        .remove([testPath]);

    } catch (error: any) {
      console.error('❌ [Debug] Test upload error:', error);
      setStatus(prev => ({
        ...prev,
        testUploadResult: `Test failed: ${error.message}`
      }));
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    try {
      setLoading(true);
      console.log('🔨 [Debug] Creating verification-documents bucket...');

      // First, try to delete existing bucket if it exists
      const { error: deleteError } = await supabase.storage.deleteBucket('verification-documents');
      if (deleteError && !deleteError.message.includes('Bucket not found')) {
        console.log('⚠️ [Debug] Delete bucket error (may be expected):', deleteError);
      }

      // Wait a bit for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new bucket with minimal configuration
      const { data, error } = await supabase.storage.createBucket('verification-documents', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        console.error('❌ [Debug] Bucket creation error:', error);
        
        // If bucket already exists, that's actually okay
        if (error.message.includes('already exists')) {
          toast({
            title: "Bucket Already Exists",
            description: "verification-documents bucket already exists",
          });
        } else {
          toast({
            title: "Bucket Creation Failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('✅ [Debug] Bucket created:', data);
      toast({
        title: "Bucket Created",
        description: "verification-documents bucket has been created successfully",
      });

      // Refresh diagnostics after creation
      await runDiagnostics();

    } catch (error: any) {
      console.error('❌ [Debug] Bucket creation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Diagnostic Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            <Database className="w-4 h-4 mr-2" />
            Run Diagnostics
          </Button>
          <Button onClick={testUpload} disabled={loading}>
            <Upload className="w-4 h-4 mr-2" />
            Test Upload
          </Button>
          <Button onClick={createBucket} disabled={loading} variant="outline">
            <HardDrive className="w-4 h-4 mr-2" />
            Create Bucket
          </Button>
        </div>

        {/* Bucket Status */}
        <div>
          <h4 className="font-medium mb-2">Storage Buckets:</h4>
          {status.bucketError ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error: {status.bucketError}
            </Badge>
          ) : (
            <div className="space-y-1">
              {status.buckets.map((bucket) => (
                <Badge 
                  key={bucket.id} 
                  className={bucket.id === 'verification-documents' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {bucket.id === 'verification-documents' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {bucket.id}
                </Badge>
              ))}
              {status.buckets.length === 0 && <span className="text-sm text-gray-500">No buckets found</span>}
            </div>
          )}
        </div>

        {/* Files Status */}
        <div>
          <h4 className="font-medium mb-2">Bucket Contents:</h4>
          {status.filesError ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              {status.filesError}
            </Badge>
          ) : (
            <div>
              <Badge className="bg-blue-100 text-blue-800">
                {status.files.length} items in bucket
              </Badge>
              {status.files.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Files: {status.files.map(f => f.name).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Database Status */}
        <div>
          <h4 className="font-medium mb-2">Database Records:</h4>
          {status.dbError ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error: {status.dbError}
            </Badge>
          ) : (
            <Badge className="bg-purple-100 text-purple-800">
              {status.dbDocs.length} documents in DB
            </Badge>
          )}
        </div>

        {/* Test Upload Status */}
        {status.testUploadResult && (
          <div>
            <h4 className="font-medium mb-2">Test Upload Result:</h4>
            <div className="p-2 bg-gray-50 rounded text-sm">
              {status.testUploadResult}
            </div>
          </div>
        )}

        {/* Detailed Info */}
        {(status.dbDocs.length > 0 || status.files.length > 0) && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h5 className="font-medium mb-2">Detailed Information:</h5>
            <div className="text-xs space-y-1">
              <div><strong>DB Documents:</strong> {JSON.stringify(status.dbDocs, null, 2)}</div>
              <div><strong>Storage Files:</strong> {JSON.stringify(status.files, null, 2)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageDebugTool;