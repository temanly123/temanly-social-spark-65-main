import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';

const TalentDocumentUpload = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchExistingDocuments();
    }
  }, [isAuthenticated, user?.id]);

  const fetchExistingDocuments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      setExistingDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentByType = (type: string) => {
    return existingDocuments.find(doc => doc.document_type === type);
  };

  const getDocumentUrl = (documentPath: string) => {
    const { data } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(documentPath);
    return data.publicUrl;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">
              Anda harus login terlebih dahulu untuk mengupload dokumen.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.user_type !== 'companion') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Halaman ini hanya untuk talent yang sudah terdaftar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Dokumen Verifikasi
            </CardTitle>
            <p className="text-sm text-gray-600">
              Upload dokumen Anda untuk verifikasi admin. Dokumen yang diupload akan direview dalam 1-2 hari kerja.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading dokumen...</p>
              </div>
            ) : (
              <>
                {/* User Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Informasi Akun</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Nama:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Status:</strong> {user.verification_status === 'pending' ? 'Menunggu Verifikasi' : user.verification_status}</p>
                  </div>
                </div>

                {/* Document Upload Sections */}
                <div className="space-y-6">
                  {/* ID Card Upload */}
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      KTP / Kartu Identitas
                    </h3>
                    {getDocumentByType('id_card') ? (
                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                              KTP telah diupload
                            </p>
                            <p className="text-xs text-green-600">
                              Status: {getDocumentByType('id_card')?.status || 'pending'}
                            </p>
                            <p className="text-xs text-green-600">
                              Diupload: {new Date(getDocumentByType('id_card')?.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const doc = getDocumentByType('id_card');
                              if (doc) {
                                window.open(getDocumentUrl(doc.document_url), '_blank');
                              }
                            }}
                          >
                            Lihat
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <DocumentUpload
                        userId={user.id}
                        documentType="id_card"
                        title="KTP / Kartu Identitas"
                        icon={<FileText className="w-4 h-4" />}
                        onUploadComplete={() => {
                          toast({
                            title: "KTP berhasil diupload!",
                            description: "Dokumen akan direview oleh admin.",
                            className: "bg-green-50 border-green-200"
                          });
                          fetchExistingDocuments();
                        }}
                      />
                    )}
                  </div>

                  {/* Profile Photo Upload */}
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Foto Profil
                    </h3>
                    {getDocumentByType('profile_photo') ? (
                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                              Foto profil telah diupload
                            </p>
                            <p className="text-xs text-green-600">
                              Status: {getDocumentByType('profile_photo')?.status || 'pending'}
                            </p>
                            <p className="text-xs text-green-600">
                              Diupload: {new Date(getDocumentByType('profile_photo')?.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const doc = getDocumentByType('profile_photo');
                              if (doc) {
                                window.open(getDocumentUrl(doc.document_url), '_blank');
                              }
                            }}
                          >
                            Lihat
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <DocumentUpload
                        userId={user.id}
                        documentType="profile_photo"
                        title="Foto Profil"
                        icon={<Camera className="w-4 h-4" />}
                        onUploadComplete={() => {
                          toast({
                            title: "Foto profil berhasil diupload!",
                            description: "Dokumen akan direview oleh admin.",
                            className: "bg-green-50 border-green-200"
                          });
                          fetchExistingDocuments();
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Status Information */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Informasi Penting:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Dokumen akan direview dalam 1-2 hari kerja</li>
                        <li>• Pastikan dokumen jelas dan sesuai dengan persyaratan</li>
                        <li>• Anda akan dihubungi melalui WhatsApp setelah verifikasi selesai</li>
                        <li>• Jika ditolak, Anda dapat mengupload ulang dokumen yang diperbaiki</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/talent-dashboard'}
                  >
                    Kembali ke Dashboard
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentDocumentUpload;