import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Camera, Upload, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
}

const DocumentVerification: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const getDocument = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!user || !file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format file salah",
        description: "Hanya file gambar yang diperbolehkan",
        variant: "destructive"
      });
      return;
    }

    setUploading(prev => ({ ...prev, [documentType]: true }));

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      // Save to database
      const { data, error } = await supabase
        .from('verification_documents')
        .upsert({
          user_id: user.id,
          document_type: documentType,
          document_url: base64Data,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
          status: 'pending'
        }, {
          onConflict: 'user_id,document_type'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Upload berhasil!",
        description: `${documentType === 'id_card' ? 'KTP' : 'Foto Profil'} berhasil diupload`,
        className: "bg-green-50 border-green-200"
      });

      // Refresh documents
      fetchDocuments();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload gagal",
        description: error.message || "Terjadi kesalahan saat upload",
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const DocumentUploadCard = ({ 
    type, 
    title, 
    icon, 
    description 
  }: { 
    type: string; 
    title: string; 
    icon: React.ReactNode; 
    description: string;
  }) => {
    const document = getDocument(type);
    const isUploading = uploading[type];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {document ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Dokumen telah diupload</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Status: <span className="capitalize">{document.status}</span></p>
                <p>Diupload: {new Date(document.created_at).toLocaleDateString('id-ID')}</p>
              </div>
              {document.document_url.startsWith('data:image/') && (
                <img 
                  src={document.document_url} 
                  alt="Preview" 
                  className="max-w-32 max-h-32 object-cover rounded border"
                />
              )}
              <div>
                <input
                  id={`file-input-${type}-replace`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, type);
                  }}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById(`file-input-${type}-replace`) as HTMLInputElement;
                    input?.click();
                  }}
                  disabled={isUploading}
                  asChild
                >
                  <label htmlFor={`file-input-${type}-replace`} className="cursor-pointer">
                    Ganti Dokumen
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{description}</p>
              <div>
                <input
                  id={`file-input-${type}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, type);
                  }}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  onClick={() => {
                    const input = document.getElementById(`file-input-${type}`) as HTMLInputElement;
                    input?.click();
                  }}
                  disabled={isUploading}
                  className="w-full"
                  asChild
                >
                  <label htmlFor={`file-input-${type}`} className="cursor-pointer flex items-center justify-center">
                    {isUploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {title}
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access document verification.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Verifikasi Dokumen</h1>
          <p className="text-gray-600 mt-2">
            Upload dokumen untuk verifikasi akun dan akses layanan premium
          </p>
        </div>

        {/* Document Upload Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <DocumentUploadCard
            type="id_card"
            title="KTP / Kartu Identitas"
            icon={<FileText className="w-5 h-5" />}
            description="Upload foto KTP atau kartu identitas resmi. Format: JPG, PNG (max 10MB)"
          />
          
          <DocumentUploadCard
            type="profile_photo"
            title="Foto Profil"
            icon={<Camera className="w-5 h-5" />}
            description="Upload foto profil terbaru. Format: JPG, PNG (max 10MB)"
          />
        </div>

        {/* Submit Section */}
        {documents.length >= 2 && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Siap untuk Review!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-green-700">
                  Kedua dokumen telah berhasil diupload. Dokumen Anda akan direview oleh admin dalam 1-2 hari kerja.
                </p>
                <Button
                  onClick={() => {
                    toast({
                      title: "Dokumen Telah Disubmit",
                      description: "Admin akan meninjau dokumen Anda segera. Anda akan mendapat notifikasi setelah diverifikasi.",
                      className: "bg-green-50 border-green-200"
                    });
                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                      navigate('/user-dashboard');
                    }, 1500);
                  }}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  Submit & Kembali ke Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informasi Verifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Proses Review</p>
                  <p className="text-sm text-gray-600">
                    Dokumen akan direview oleh admin dalam 1-2 hari kerja
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Akses Premium</p>
                  <p className="text-sm text-gray-600">
                    Setelah diverifikasi, Anda dapat mengakses layanan Offline Date dan Party Buddy
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Kualitas Dokumen</p>
                  <p className="text-sm text-gray-600">
                    Pastikan dokumen jelas, tidak buram, dan semua informasi terlihat dengan baik
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentVerification;
