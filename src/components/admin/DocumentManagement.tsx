
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import DocumentPreviewModal from './DocumentPreviewModal';

interface Document {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  file_name?: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_email?: string;
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();







  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [DocumentManagement] Fetching documents from database...');
      
      // Fetch documents directly from database
      const { data: documentsData, error } = await supabase
        .from('verification_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DocumentManagement] Error fetching documents:', error);
        throw error;
      }

      console.log('📋 [DocumentManagement] Documents fetched:', documentsData?.length || 0);

      // Fetch user profiles separately to avoid foreign key issues
      const userIds = [...new Set(documentsData?.map(doc => doc.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email, verification_status')
        .in('id', userIds);

      console.log('👥 [DocumentManagement] User profiles:', profilesData?.length || 0);

      // Transform data with manual join
      const transformedDocs: Document[] = (documentsData || []).map(doc => {
        const userProfile = profilesData?.find(profile => profile.id === doc.user_id);
        return {
          id: doc.id,
          user_id: doc.user_id,
          document_type: doc.document_type,
          document_url: doc.document_url,
          status: doc.status as 'pending' | 'approved' | 'rejected',
          file_name: doc.file_name,
          file_size: doc.file_size,
          content_type: doc.content_type,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          user_name: userProfile?.name || 'Unknown User',
          user_email: userProfile?.email || 'No Email'
        };
      });

      setDocuments(transformedDocs);
      console.log('✅ [DocumentManagement] Documents processed successfully:', transformedDocs.length);

    } catch (error: any) {
      console.error('❌ [DocumentManagement] Error in fetchDocuments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat dokumen: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: 'approved' | 'rejected') => {
    try {
      console.log('🔄 [DocumentManagement] === STARTING DOCUMENT UPDATE ===');
      console.log('🔄 [DocumentManagement] Document ID:', documentId);
      console.log('🔄 [DocumentManagement] New Status:', newStatus);
      console.log('🔄 [DocumentManagement] Current documents count:', documents.length);

      // Update document status directly
      console.log('🔄 [DocumentManagement] Updating document status...');
      const { error } = await supabase
        .from('verification_documents')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId
            ? { ...doc, status: newStatus, updated_at: new Date().toISOString() }
            : doc
        )
      );

      // Update selected document if it's the one being updated
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument(prev => prev ? {
          ...prev,
          status: newStatus,
          updated_at: new Date().toISOString()
        } : null);
      }

      // Check if user has both documents approved
      const document = documents.find(d => d.id === documentId);
      if (document && newStatus === 'approved') {
        const userDocs = documents.filter(d => d.user_id === document.user_id);
        const approvedDocs = userDocs.filter(d => d.status === 'approved' || (d.id === documentId));

        if (approvedDocs.length >= 2) {
          // Update user verification status
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              verification_status: 'verified',
              status: 'active'
            })
            .eq('id', document.user_id);

          if (profileError) {
            console.error('❌ [DocumentManagement] Error updating profile:', profileError);
          } else {
            console.log('✅ [DocumentManagement] User verification status updated');
          }
        }
      }

      // If any document is rejected, completely delete the user and all their data
      if (newStatus === 'rejected') {
        const document = documents.find(d => d.id === documentId);
        if (document) {
          console.log('🗑️ [DocumentManagement] Document rejected, deleting entire user and all data...');

          try {
            // Use the admin-delete-user edge function for complete cleanup
            const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
              body: { userId: document.user_id }
            });

            if (deleteError) {
              console.error('❌ [DocumentManagement] Edge function failed:', deleteError);

              // Fallback: Direct database deletion
              console.log('🔄 [DocumentManagement] Attempting fallback deletion...');

              // Delete all documents for this user
              await supabase
                .from('verification_documents')
                .delete()
                .eq('user_id', document.user_id);

              // Delete profile
              await supabase
                .from('profiles')
                .delete()
                .eq('id', document.user_id);

              console.log('✅ [DocumentManagement] Fallback deletion completed');
            } else {
              console.log('✅ [DocumentManagement] Edge function deletion completed:', deleteResult);
            }

            // Remove all documents for this user from local state
            setDocuments(prev => prev.filter(d => d.user_id !== document.user_id));

            toast({
              title: "User Completely Deleted",
              description: "Document rejected. User and all their data have been permanently deleted.",
              className: "bg-red-50 border-red-200"
            });

            return; // Exit early since user is deleted

          } catch (deleteError) {
            console.error('❌ [DocumentManagement] Failed to delete user:', deleteError);
            toast({
              title: "Deletion Failed",
              description: "Document rejected but failed to delete user. Please use the Rejected Document Cleaner.",
              variant: "destructive"
            });
          }
        }
      }

      toast({
        title: "Status berhasil diupdate",
        description: `Dokumen telah ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}`,
        className: "bg-green-50 border-green-200"
      });

      console.log('✅ [DocumentManagement] Document status updated successfully');

      // Refresh documents from database to ensure we have latest data
      console.log('🔄 [DocumentManagement] Refreshing documents from database...');
      await fetchDocuments();

    } catch (error: any) {
      console.error('❌ [DocumentManagement] Error updating document status:', error);
      console.error('❌ [DocumentManagement] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      toast({
        title: "Error",
        description: `Gagal mengupdate status dokumen: ${error.message}${error.details ? ` (${error.details})` : ''}`,
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    console.log('👁️ [DocumentManagement] Viewing document:', document.id);
    
    // For base64 data (new approach), view directly
    if (document.document_url.startsWith('data:')) {
      console.log('📷 [DocumentManagement] Viewing base64 document directly');
      setSelectedDocument(document);
      setShowPreviewModal(true);
      return;
    }

    // For legacy storage paths, try to get signed URL
    console.log('🗃️ [DocumentManagement] Attempting to get signed URL for legacy document');
    toast({
      title: "Info",
      description: "Dokumen ini menggunakan format lama. Jika tidak dapat dibuka, minta user upload ulang.",
      variant: "default"
    });
    
    setSelectedDocument(document);
    setShowPreviewModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />Approved
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="w-3 h-3 mr-1" />Rejected
        </Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />Pending
        </Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isBase64Document = (url: string) => url.startsWith('data:');

  const pendingCount = documents.filter(doc => doc.status === 'pending').length;
  const approvedCount = documents.filter(doc => doc.status === 'approved').length;
  const rejectedCount = documents.filter(doc => doc.status === 'rejected').length;
  const legacyCount = documents.filter(doc => !isBase64Document(doc.document_url)).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Memuat dokumen...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Dokumen</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legacy Warning */}
      {legacyCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-medium">Peringatan: {legacyCount} dokumen menggunakan format lama</p>
                <p className="text-sm">Dokumen ini mungkin tidak dapat ditampilkan dengan baik. Minta user untuk upload ulang jika diperlukan.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manajemen Dokumen Verifikasi</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={fetchDocuments} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Tidak ada dokumen yang ditemukan</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" />
                        <h3 className="font-medium">
                          {doc.document_type === 'id_card' ? 'KTP/ID Card' : 'Foto Profil'}
                        </h3>
                        {getStatusBadge(doc.status)}
                        {!isBase64Document(doc.document_url) && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Legacy
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>User:</strong> {doc.user_name} ({doc.user_email})</p>
                        <p><strong>File:</strong> {doc.file_name || 'Unknown'}</p>
                        <p><strong>Size:</strong> {formatFileSize(doc.file_size)}</p>
                        <p><strong>Uploaded:</strong> {new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                        <p><strong>Storage:</strong> {isBase64Document(doc.document_url) ? 'Database (Aman)' : 'Legacy Storage'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                      
                      {doc.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('🎯 [DocumentManagement] APPROVE BUTTON CLICKED for document:', doc.id);
                              updateDocumentStatus(doc.id, 'approved');
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateDocumentStatus(doc.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Tolak
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedDocument(null);
          }}
          onApprove={() => updateDocumentStatus(selectedDocument.id, 'approved')}
          onReject={() => updateDocumentStatus(selectedDocument.id, 'rejected')}
        />
      )}
    </div>
  );
};

export default DocumentManagement;
