
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Download, FileText, AlertTriangle } from 'lucide-react';

interface DocumentPreviewModalProps {
  document: {
    id: string;
    document_type: string;
    document_url: string;
    status: string;
    file_name?: string;
    file_size?: number;
    content_type?: string;
    user_name?: string;
    user_email?: string;
    created_at: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const isBase64 = document.document_url.startsWith('data:');
  const isImage = document.content_type?.startsWith('image/') || document.document_url.startsWith('data:image/');

  const handleApprove = () => {
    if (onApprove) {
      onApprove();
      onClose();
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject();
      onClose();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Preview Dokumen - {document.document_type === 'id_card' ? 'KTP/ID Card' : 'Foto Profil'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">User</p>
              <p>{document.user_name} ({document.user_email})</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              {getStatusBadge(document.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">File Name</p>
              <p>{document.file_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">File Size</p>
              <p>{formatFileSize(document.file_size)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upload Date</p>
              <p>{new Date(document.created_at).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Storage Type</p>
              <p className="flex items-center gap-2">
                {isBase64 ? (
                  <>
                    <span className="text-green-600">Database</span>
                    <Badge variant="outline" className="text-green-600">Aman</Badge>
                  </>
                ) : (
                  <>
                    <span className="text-orange-600">Legacy Storage</span>
                    <Badge variant="outline" className="text-orange-600">Legacy</Badge>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Document Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview Dokumen</h3>
            
            {isBase64 && isImage ? (
              <div className="border rounded-lg p-4 bg-white">
                <img 
                  src={document.document_url} 
                  alt="Document Preview" 
                  className="max-w-full max-h-96 mx-auto object-contain rounded"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : !isBase64 ? (
              <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-orange-50">
                <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-orange-800 mb-2">Dokumen Legacy</h4>
                <p className="text-sm text-orange-600 mb-4">
                  Dokumen ini menggunakan format penyimpanan lama dan mungkin tidak dapat ditampilkan.
                </p>
                <p className="text-xs text-orange-500">
                  Minta user untuk upload ulang dokumen jika preview tidak dapat ditampilkan.
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Preview tidak tersedia untuk jenis file ini</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Only show if approve/reject functions are provided */}
          {document.status === 'pending' && onApprove && onReject && (
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Tolak Dokumen
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Setujui Dokumen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
