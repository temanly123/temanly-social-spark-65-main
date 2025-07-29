import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle, CheckCircle, XCircle, FileText, User } from 'lucide-react';

interface RejectedDocument {
  id: string;
  user_id: string;
  document_type: string;
  status: string;
  created_at: string;
  file_name?: string;
  user_name?: string;
  user_email?: string;
}

const RejectedDocumentCleaner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rejectedDocs, setRejectedDocs] = useState<RejectedDocument[]>([]);
  const [cleaning, setCleaning] = useState(false);
  const { toast } = useToast();

  const findRejectedDocuments = async () => {
    try {
      setLoading(true);
      console.log('🔍 [RejectedDocumentCleaner] Searching for rejected documents...');
      
      // Get all rejected documents
      const { data: rejectedDocuments, error: docsError } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      console.log('📄 [RejectedDocumentCleaner] Found rejected documents:', rejectedDocuments?.length || 0);

      if (!rejectedDocuments || rejectedDocuments.length === 0) {
        setRejectedDocs([]);
        toast({
          title: "No Rejected Documents",
          description: "No rejected documents found in the system.",
        });
        return;
      }

      // Get user information for each rejected document
      const userIds = [...new Set(rejectedDocuments.map(doc => doc.user_id))];
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        console.warn('⚠️ [RejectedDocumentCleaner] Could not fetch user data:', usersError);
      }

      // Combine document and user data
      const enrichedDocs: RejectedDocument[] = rejectedDocuments.map(doc => {
        const user = users?.find(u => u.id === doc.user_id);
        return {
          ...doc,
          user_name: user?.name || 'Unknown User',
          user_email: user?.email || 'Unknown Email'
        };
      });

      setRejectedDocs(enrichedDocs);

      toast({
        title: "Search Complete",
        description: `Found ${rejectedDocuments.length} rejected documents from ${userIds.length} users`,
      });
      
    } catch (error: any) {
      console.error('❌ [RejectedDocumentCleaner] Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanAllRejectedDocuments = async () => {
    if (rejectedDocs.length === 0) {
      toast({
        title: "Nothing to Clean",
        description: "No rejected documents found to clean.",
      });
      return;
    }

    try {
      setCleaning(true);
      console.log('🧹 [RejectedDocumentCleaner] Cleaning all rejected documents and users...');
      
      // Get unique user IDs from rejected documents
      const userIds = [...new Set(rejectedDocs.map(doc => doc.user_id))];
      console.log('👥 [RejectedDocumentCleaner] Users to delete:', userIds.length);

      let successfulDeletions = 0;
      let failedDeletions = 0;

      // Delete each user completely (this will also delete their documents)
      for (const userId of userIds) {
        try {
          console.log(`🗑️ [RejectedDocumentCleaner] Deleting user: ${userId}`);
          
          // Use the admin-delete-user edge function for complete cleanup
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: userId }
          });

          if (deleteError) {
            console.error(`❌ [RejectedDocumentCleaner] Edge function failed for ${userId}:`, deleteError);
            
            // Fallback: Direct database deletion
            console.log(`🔄 [RejectedDocumentCleaner] Attempting fallback deletion for ${userId}...`);
            
            // Delete documents first
            const { error: docsDeleteError } = await supabase
              .from('verification_documents')
              .delete()
              .eq('user_id', userId);

            if (docsDeleteError) {
              console.error(`❌ [RejectedDocumentCleaner] Failed to delete documents for ${userId}:`, docsDeleteError);
            }

            // Delete profile
            const { error: profileDeleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userId);

            if (profileDeleteError) {
              console.error(`❌ [RejectedDocumentCleaner] Failed to delete profile for ${userId}:`, profileDeleteError);
              failedDeletions++;
            } else {
              console.log(`✅ [RejectedDocumentCleaner] Fallback deletion successful for ${userId}`);
              successfulDeletions++;
            }
          } else {
            console.log(`✅ [RejectedDocumentCleaner] Edge function deletion successful for ${userId}:`, deleteResult);
            successfulDeletions++;
          }
        } catch (userError) {
          console.error(`❌ [RejectedDocumentCleaner] Failed to delete user ${userId}:`, userError);
          failedDeletions++;
        }
      }

      // Clear the rejected documents list
      setRejectedDocs([]);
      
      toast({
        title: "Cleanup Complete",
        description: `Successfully deleted ${successfulDeletions} users and their documents. ${failedDeletions} failed.`,
        className: failedDeletions === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
      });

      console.log(`✅ [RejectedDocumentCleaner] Cleanup completed: ${successfulDeletions} successful, ${failedDeletions} failed`);
      
    } catch (error: any) {
      console.error('❌ [RejectedDocumentCleaner] Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  const cleanSingleDocument = async (doc: RejectedDocument) => {
    try {
      console.log(`🗑️ [RejectedDocumentCleaner] Deleting single user: ${doc.user_id}`);
      
      // Use the admin-delete-user edge function for complete cleanup
      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: doc.user_id }
      });

      if (deleteError) {
        console.error(`❌ [RejectedDocumentCleaner] Edge function failed:`, deleteError);
        throw deleteError;
      }

      console.log(`✅ [RejectedDocumentCleaner] User and documents deleted:`, deleteResult);
      
      // Remove from local state
      setRejectedDocs(prev => prev.filter(d => d.user_id !== doc.user_id));
      
      toast({
        title: "User Deleted",
        description: `${doc.user_name} and all their documents have been deleted`,
        className: "bg-green-50 border-green-200"
      });
      
    } catch (error: any) {
      console.error('❌ [RejectedDocumentCleaner] Single deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Rejected Document Cleaner
        </CardTitle>
        <p className="text-sm text-gray-600">
          Find and completely delete all rejected documents and their associated user accounts.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={findRejectedDocuments} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {loading ? 'Searching...' : 'Find Rejected Documents'}
            </Button>

            {rejectedDocs.length > 0 && (
              <Button 
                onClick={cleanAllRejectedDocuments} 
                disabled={cleaning}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {cleaning ? 'Cleaning...' : `Delete All ${rejectedDocs.length} Users`}
              </Button>
            )}
          </div>

          {rejectedDocs.length > 0 && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Found {rejectedDocs.length} Rejected Documents
                  </span>
                </div>
                <p className="text-xs text-red-700">
                  These documents were rejected but users and documents still exist in the system.
                </p>
              </div>

              {rejectedDocs.map((doc) => (
                <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{doc.user_name}</span>
                          <Badge variant="destructive" className="text-xs">
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{doc.user_email}</p>
                        <p className="text-xs text-gray-500">
                          User ID: {doc.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => cleanSingleDocument(doc)} 
                      disabled={cleaning}
                      size="sm"
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete User
                    </Button>
                  </div>

                  <div className="bg-white rounded p-2 border text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.document_type}
                      </Badge>
                      <span className="text-gray-600">
                        {doc.file_name || 'No filename'}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-1">
                      Rejected: {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rejectedDocs.length === 0 && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  No rejected documents found
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                All rejected documents have been properly cleaned up.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RejectedDocumentCleaner;
