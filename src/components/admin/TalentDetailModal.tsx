import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Heart, 
  Star, 
  FileText, 
  Image as ImageIcon, 
  CreditCard,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/services/adminUserService';
import DocumentPreviewModal from './DocumentPreviewModal';

interface TalentDetailModalProps {
  talent: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (talentId: string) => void;
  onReject?: (talentId: string) => void;
}

interface VerificationDocument {
  id: string;
  document_type: string;
  document_url: string | null;
  status: string | null;
  admin_notes?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  content_type?: string | null;
  created_at: string;
  updated_at?: string | null;
  user_id: string;
  verified_by?: string | null;
}

const TalentDetailModal: React.FC<TalentDetailModalProps> = ({
  talent,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    if (talent && isOpen) {
      fetchDocuments();
    }
  }, [talent, isOpen]);

  const fetchDocuments = async () => {
    if (!talent) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', talent.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewDocument = (document: VerificationDocument) => {
    setSelectedDocument(document);
    setPreviewModalOpen(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getDocumentIcon = (documentType: string) => {
    switch (documentType.toLowerCase()) {
      case 'ktp':
      case 'id_card':
        return <CreditCard className="w-4 h-4" />;
      case 'profile_photo':
      case 'foto_profil':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const parseProfileData = (profileData: any) => {
    if (!profileData) return null;
    
    try {
      return typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
    } catch {
      return profileData;
    }
  };

  if (!talent) return null;

  const profileData = parseProfileData(talent.profile_data);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <User className="w-5 h-5" />
              Detail Lengkap - {talent.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="h-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="profile">Informasi Profile</TabsTrigger>
              <TabsTrigger value="services">Layanan & Tarif</TabsTrigger>
              <TabsTrigger value="documents">Dokumen Verifikasi</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(90vh-200px)] mt-4">
              <TabsContent value="profile" className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                      <p className="font-medium">{talent.full_name || talent.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {talent.email}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">No. Telepon</label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {talent.phone || 'Tidak tersedia'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Usia</label>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {talent.age || 'Tidak tersedia'} tahun
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Lokasi</label>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {talent.location || talent.city || 'Tidak tersedia'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Zodiak</label>
                      <p className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        {talent.zodiac || 'Tidak tersedia'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Love Language</label>
                      <p className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        {talent.love_language || 'Tidak tersedia'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Party Buddy</label>
                      <p>{talent.party_buddy_eligible ? 'Ya' : 'Tidak'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio */}
                {talent.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Bio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{talent.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Informasi Sistem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="font-mono text-xs">{talent.id}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Status Verifikasi</label>
                      <p>{getStatusBadge(talent.verification_status)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Tanggal Daftar</label>
                      <p>{new Date(talent.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Terakhir Update</label>
                      <p>{talent.updated_at ? new Date(talent.updated_at).toLocaleDateString('id-ID') : 'Tidak ada'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Auth Only</label>
                      <p>{talent.auth_only ? 'Ya' : 'Tidak'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Has Profile</label>
                      <p>{talent.has_profile ? 'Ya' : 'Tidak'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Profile Data */}
                {profileData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Pendaftaran Lengkap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {profileData.emergencyContact && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Kontak Darurat</label>
                            <p>{profileData.emergencyContact}</p>
                          </div>
                        )}
                        {profileData.emergencyPhone && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">No. Kontak Darurat</label>
                            <p>{profileData.emergencyPhone}</p>
                          </div>
                        )}
                        {profileData.transportationMode && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Moda Transportasi</label>
                            <p className="capitalize">{profileData.transportationMode}</p>
                          </div>
                        )}
                        {profileData.languages && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Bahasa</label>
                            <p>{Array.isArray(profileData.languages) ? profileData.languages.join(', ') : profileData.languages}</p>
                          </div>
                        )}
                        {profileData.dateInterests && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-gray-500">Minat Date</label>
                            <div className="flex flex-wrap gap-2">
                              {profileData.dateInterests.map((interest: string, index: number) => (
                                <Badge key={index} variant="outline">{interest}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Informasi Layanan & Tarif
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Tarif per Jam</label>
                        <p className="font-semibold text-lg">
                          {talent.hourly_rate ? `Rp ${talent.hourly_rate.toLocaleString('id-ID')}` : 'Belum ditetapkan'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Rating</label>
                        <p className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {talent.rating || 0}/5
                        </p>
                      </div>
                    </div>

                    {profileData?.availableServices && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Layanan yang Ditawarkan</label>
                        <div className="flex flex-wrap gap-2">
                          {profileData.availableServices.map((service: string, index: number) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800">
                              {service.replace('-', ' ').replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData?.rentLoverDetails && (
                      <Card className="border border-purple-200">
                        <CardHeader>
                          <CardTitle className="text-sm">Rent Lover Package</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Harga</label>
                            <p className="font-semibold">Rp {profileData.rentLoverDetails.price?.toLocaleString('id-ID')}</p>
                          </div>
                          {profileData.rentLoverDetails.description && (
                            <div>
                              <label className="text-xs font-medium text-gray-500">Deskripsi</label>
                              <p className="text-sm">{profileData.rentLoverDetails.description}</p>
                            </div>
                          )}
                          {profileData.rentLoverDetails.inclusions && (
                            <div>
                              <label className="text-xs font-medium text-gray-500">Yang Termasuk</label>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {profileData.rentLoverDetails.inclusions.map((item: string, index: number) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {profileData?.availability && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Ketersediaan</label>
                        {profileData.availability.partyBuddy?.available && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium">Party Buddy Available</p>
                            {profileData.availability.partyBuddy.weekends && (
                              <p className="text-xs text-gray-600">
                                Hari: {profileData.availability.partyBuddy.weekends.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Dokumen Verifikasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Memuat dokumen...</p>
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Belum ada dokumen yang diupload</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getDocumentIcon(doc.document_type)}
                                <div>
                                  <h4 className="font-medium capitalize">
                                    {doc.document_type.replace('_', ' ')}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.file_size)} • {doc.content_type}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Uploaded: {new Date(doc.created_at).toLocaleDateString('id-ID')}
                                  </p>
                                  {/* Show storage type indicator */}
                                  <p className="text-xs text-blue-500">
                                    {doc.document_url?.startsWith('data:') ? '💾 Database Storage' : '☁️ Cloud Storage'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(doc.status)}
                                {doc.document_url ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePreviewDocument(doc)}
                                    className="flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Preview
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                                    ⚠️ File Missing
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {doc.admin_notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <strong>Admin Notes:</strong> {doc.admin_notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>

            {/* Action Buttons */}
            {talent.verification_status === 'pending' && (onApprove || onReject) && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                {onReject && (
                  <Button 
                    variant="destructive" 
                    onClick={() => onReject(talent.id)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </Button>
                )}
                {onApprove && (
                  <Button 
                    onClick={() => onApprove(talent.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Setujui
                  </Button>
                )}
              </div>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedDocument(null);
        }}
        onApprove={() => {
          // Handle approval logic if needed
          setPreviewModalOpen(false);
          setSelectedDocument(null);
        }}
        onReject={() => {
          // Handle rejection logic if needed
          setPreviewModalOpen(false);
          setSelectedDocument(null);
        }}
      />
    </>
  );
};

export default TalentDetailModal;