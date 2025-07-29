import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wrench, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

const DocumentRepairTool = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const repairDocuments = async () => {
    try {
      setLoading(true);
      console.log('🔧 [DocumentRepair] Starting document repair process...');

      // Step 1: Find all documents with invalid data
      const { data: allDocs, error: fetchError } = await supabase
        .from('verification_documents')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      console.log('📊 [DocumentRepair] Total documents found:', allDocs?.length || 0);

      const invalidDocs = allDocs?.filter(doc => {
        const hasInvalidUrl = !doc.document_url || !doc.document_url.startsWith('data:image/');
        return hasInvalidUrl;
      }) || [];

      const validDocs = allDocs?.filter(doc => {
        const hasValidUrl = doc.document_url && doc.document_url.startsWith('data:image/');
        return hasValidUrl;
      }) || [];

      console.log('📊 [DocumentRepair] Analysis:', {
        total: allDocs?.length || 0,
        valid: validDocs.length,
        invalid: invalidDocs.length
      });

      // Step 2: Delete invalid documents
      let deletedCount = 0;
      if (invalidDocs.length > 0) {
        console.log('🗑️ [DocumentRepair] Deleting invalid documents...');
        
        for (const doc of invalidDocs) {
          const { error: deleteError } = await supabase
            .from('verification_documents')
            .delete()
            .eq('id', doc.id);

          if (!deleteError) {
            deletedCount++;
            console.log('✅ [DocumentRepair] Deleted invalid document:', doc.id);
          } else {
            console.error('❌ [DocumentRepair] Failed to delete document:', doc.id, deleteError);
          }
        }
      }

      // Step 3: Check for users without any documents
      const { data: companionUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('user_type', 'companion');

      if (usersError) {
        throw usersError;
      }

      const usersWithoutDocs = companionUsers?.filter(user => {
        const userDocs = validDocs.filter(doc => doc.user_id === user.id);
        return userDocs.length === 0;
      }) || [];

      const usersWithPartialDocs = companionUsers?.filter(user => {
        const userDocs = validDocs.filter(doc => doc.user_id === user.id);
        return userDocs.length > 0 && userDocs.length < 2;
      }) || [];

      const usersWithCompleteDocs = companionUsers?.filter(user => {
        const userDocs = validDocs.filter(doc => doc.user_id === user.id);
        return userDocs.length >= 2;
      }) || [];

      const repairResults = {
        totalDocuments: allDocs?.length || 0,
        validDocuments: validDocs.length,
        invalidDocuments: invalidDocs.length,
        deletedDocuments: deletedCount,
        totalUsers: companionUsers?.length || 0,
        usersWithoutDocs: usersWithoutDocs.length,
        usersWithPartialDocs: usersWithPartialDocs.length,
        usersWithCompleteDocs: usersWithCompleteDocs.length,
        usersWithoutDocsDetails: usersWithoutDocs,
        usersWithPartialDocsDetails: usersWithPartialDocs
      };

      setResults(repairResults);

      toast({
        title: "🔧 Document Repair Complete",
        description: `Deleted ${deletedCount} invalid documents. ${validDocs.length} valid documents remain.`,
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('❌ [DocumentRepair] Error:', error);
      toast({
        title: "Repair Failed",
        description: error.message || "Failed to repair documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllDocuments = async () => {
    if (!confirm('Are you sure you want to delete ALL documents? This cannot be undone!')) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ [DocumentRepair] Clearing all documents...');

      const { error } = await supabase
        .from('verification_documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw error;
      }

      toast({
        title: "🗑️ All Documents Cleared",
        description: "All documents have been deleted from the database.",
        className: "bg-red-50 border-red-200"
      });

      setResults(null);

    } catch (error: any) {
      console.error('❌ [DocumentRepair] Clear error:', error);
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear documents",
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
          <Wrench className="w-5 h-5" />
          Document Repair Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={repairDocuments} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            {loading ? 'Repairing...' : 'Repair Documents'}
          </Button>
          
          <Button 
            onClick={clearAllDocuments} 
            disabled={loading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Documents
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-lg font-bold text-blue-600">{results.totalDocuments}</div>
                <div className="text-xs text-blue-600">Total Documents</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded">
                <div className="text-lg font-bold text-green-600">{results.validDocuments}</div>
                <div className="text-xs text-green-600">Valid Documents</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded">
                <div className="text-lg font-bold text-red-600">{results.deletedDocuments}</div>
                <div className="text-xs text-red-600">Deleted Invalid</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-lg font-bold text-purple-600">{results.totalUsers}</div>
                <div className="text-xs text-purple-600">Total Users</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">Complete Documents</span>
                </div>
                <div className="text-lg font-bold text-green-600">{results.usersWithCompleteDocs}</div>
                <div className="text-xs text-green-600">Users with both documents</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-600">Partial Documents</span>
                </div>
                <div className="text-lg font-bold text-yellow-600">{results.usersWithPartialDocs}</div>
                <div className="text-xs text-yellow-600">Users with 1 document</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-600">No Documents</span>
                </div>
                <div className="text-lg font-bold text-red-600">{results.usersWithoutDocs}</div>
                <div className="text-xs text-red-600">Users with no documents</div>
              </div>
            </div>

            {results.usersWithoutDocsDetails.length > 0 && (
              <div className="bg-red-50 p-4 rounded">
                <h3 className="font-semibold text-red-800 mb-2">Users Without Documents:</h3>
                <div className="space-y-1 text-sm">
                  {results.usersWithoutDocsDetails.map((user: any) => (
                    <div key={user.id} className="text-red-700">
                      {user.full_name} ({user.email})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.usersWithPartialDocsDetails.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">Users With Partial Documents:</h3>
                <div className="space-y-1 text-sm">
                  {results.usersWithPartialDocsDetails.map((user: any) => (
                    <div key={user.id} className="text-yellow-700">
                      {user.full_name} ({user.email})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentRepairTool;
