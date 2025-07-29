import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Mail, Phone, User, MapPin, Calendar, Heart, Star, Briefcase, Car, AlertCircle, Eye, FileText, Camera, IdCard, Users, Activity, Gift, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DocumentPreviewModal from './DocumentPreviewModal';

interface TalentApprovalCardProps {
  talent: any;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onDelete?: (id: string, name: string) => void;
  showDeleteOption?: boolean;
}

const TalentApprovalCard: React.FC<TalentApprovalCardProps> = ({
  talent,
  onApprove,
  onReject,
  onDelete,
  showDeleteOption = false
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; type: string } | null>(null);
  const [documentUrls, setDocumentUrls] = useState<{id_card?: string, profile_photo?: string}>({});
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Fetch documents for this talent
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        
        console.log('🗄️ [TalentApproval] Fetching documents for talent:', talent.id);
        console.log('🗄️ [TalentApproval] Talent object:', { 
          id: talent.id, 
          email: talent.email, 
          full_name: talent.full_name,
          verification_status: talent.verification_status 
        });
        
        // Fetch from verification_documents table - same approach as DocumentUploadTest
        console.log('🔍 [TalentApproval] Searching for documents with user_id:', talent.id);
        const { data: documentsData, error: documentsError } = await supabase
          .from('verification_documents')
          .select('*')
          .eq('user_id', talent.id);

        if (documentsError) {
          console.error('❌ [TalentApproval] Error fetching documents:', documentsError);
        } else {
          console.log('✅ [TalentApproval] Raw documents from DB:', documentsData);
          setDocuments(documentsData || []);
          
          // Process base64 stored documents - EXACT same logic as DocumentUploadTest
          const urls: {id_card?: string, profile_photo?: string} = {};
          
          if (documentsData && documentsData.length > 0) {
            console.log(`🔍 [TalentApproval] Processing ${documentsData.length} documents...`);
            
            for (const doc of documentsData) {
              console.log('🔍 [TalentApproval] Processing document:', {
                id: doc.id,
                type: doc.document_type,
                hasUrl: !!doc.document_url,
                isBase64: doc.document_url?.startsWith('data:image/') || false,
                urlLength: doc.document_url?.length || 0,
                status: doc.status,
                created_at: doc.created_at
              });
              
              // Check if document_url contains base64 data (same as DocumentUploadTest)
              if (doc.document_url && doc.document_url.startsWith('data:image/')) {
                console.log('✅ [TalentApproval] Found valid base64 document:', doc.document_type);
                if (doc.document_type === 'id_card') {
                  urls.id_card = doc.document_url;
                } else if (doc.document_type === 'profile_photo') {
                  urls.profile_photo = doc.document_url;
                }
              } else {
                console.warn('⚠️ [TalentApproval] Document found but no valid base64 URL:', {
                  type: doc.document_type,
                  hasUrl: !!doc.document_url,
                  urlPrefix: doc.document_url?.substring(0, 50) || 'empty'
                });
              }
            }
          } else {
            console.log('📝 [TalentApproval] No documents found in database for talent:', talent.id);
          }
          
          console.log('✅ [TalentApproval] Final processed document URLs:', {
            id_card: urls.id_card ? `Found base64 (${urls.id_card.substring(0, 50)}...)` : 'Not found',
            profile_photo: urls.profile_photo ? `Found base64 (${urls.profile_photo.substring(0, 50)}...)` : 'Not found',
            totalDocuments: documentsData?.length || 0
          });
          
          setDocumentUrls(urls);
        }
      } catch (error) {
        console.error('❌ [TalentApproval] Error fetching documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    if (talent.id) {
      fetchDocuments();
    }
  }, [talent.id]);

  const getDocumentUrl = (documentPath: string) => {
    const { data } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(documentPath);
    return data.publicUrl;
  };

  const getDocumentByType = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Menunggu Review</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleReject = () => {
    onReject(talent.id, rejectionReason);
    setShowRejectionDialog(false);
    setRejectionReason('');
  };

  const handleViewDocument = (url: string, type: 'id_card' | 'profile_photo') => {
    // Create document object compatible with DocumentPreviewModal
    const doc = getDocumentByType(type);
    const documentData = {
      id: doc?.id || `temp-${Date.now()}`,
      document_type: type,
      document_url: url,
      status: doc?.status || 'pending',
      file_name: doc?.file_name || `${type}.jpg`,
      file_size: doc?.file_size || 0,
      content_type: doc?.content_type || 'image/jpeg',
      user_name: talent.full_name || 'Unknown',
      user_email: talent.email || 'Unknown',
      created_at: doc?.created_at || new Date().toISOString(),
    };
    
    setSelectedDocument({ url, type });
    setShowDocumentModal(true);
  };

  // Parse profile data if available
  let profileData = null;
  if (talent.profile_data) {
    try {
      profileData = JSON.parse(talent.profile_data);
    } catch (error) {
      console.warn('Failed to parse profile data:', error);
    }
  }

  const rawMetadata = talent.raw_user_meta_data || {};

  // Format data for better display
  const formatProfileData = () => {
    const data = profileData || rawMetadata || {};
    const formatted: { [key: string]: any } = {};
    
    // Map of field keys to user-friendly labels
    const fieldLabels: { [key: string]: string } = {
      'full_name': 'Nama Lengkap',
      'phone': 'Nomor Telepon',
      'age': 'Usia',
      'location': 'Lokasi',
      'city': 'Kota',
      'bio': 'Deskripsi Diri',
      'hourly_rate': 'Tarif per Jam',
      'hourlyRate': 'Tarif per Jam',
      'services': 'Layanan yang Ditawarkan',
      'availableServices': 'Layanan yang Tersedia',
      'selectedServices': 'Layanan yang Dipilih',
      'languages': 'Bahasa yang Dikuasai',
      'interests': 'Minat & Hobi',
      'dateInterests': 'Minat Kencan',
      'experience_years': 'Pengalaman (Tahun)',
      'experienceYears': 'Pengalaman (Tahun)',
      'transportation_mode': 'Moda Transportasi',
      'transportationMode': 'Moda Transportasi',
      'emergency_contact': 'Kontak Darurat',
      'emergencyContact': 'Kontak Darurat',
      'emergency_phone': 'Nomor Darurat',
      'emergencyPhone': 'Nomor Darurat',
      'availability': 'Ketersediaan',
      'date_activities': 'Aktivitas Kencan',
      'dateActivities': 'Aktivitas Kencan',
      'zodiac': 'Zodiak',
      'love_language': 'Bahasa Cinta',
      'loveLanguage': 'Bahasa Cinta',
      'party_buddy_eligible': 'Tersedia sebagai Party Buddy',
      'partyBuddyEligible': 'Tersedia sebagai Party Buddy',
      'service_rates': 'Tarif per Layanan',
      'serviceRates': 'Tarif per Layanan',
      'hasIdCard': 'Memiliki KTP',
      'hasProfilePhoto': 'Memiliki Foto Profil',
      'businessModel': 'Model Bisnis',
    };

    // Format values for better display
    const formatValue = (key: string, value: any) => {
      if (value === null || value === undefined || value === '') return 'Tidak tersedia';
      
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'Tidak ada data';
      }
      
      if (typeof value === 'boolean') {
        return value ? 'Ya' : 'Tidak';
      }
      
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('tarif')) {
        if (typeof value === 'number' && value > 0) {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(value);
        }
        return 'Belum ditentukan';
      }

      if (typeof value === 'object' && value !== null) {
        if (key.toLowerCase().includes('rates')) {
          return Object.entries(value).map(([k, v]) => `${k}: ${formatValue('rate', v)}`).join(', ');
        }
        if (key === 'availability' && value.general) {
          return `Umum: ${value.general?.join(', ') || 'Tidak ada'}`;
        }
        return JSON.stringify(value, null, 2);
      }
      
      return String(value);
    };

    // Filter out sensitive or irrelevant data
    const skipKeys = ['idCardFile', 'profilePhotoFile', 'sub', 'email_verified', 'phone_verified', 'registrationTimestamp', 'formVersion', 'aud', 'exp', 'iat', 'iss', 'email'];

    Object.entries(data)
      .filter(([key, value]) => 
        !skipKeys.includes(key) && 
        value !== null && 
        value !== undefined && 
        value !== '' &&
        !(typeof value === 'object' && Object.keys(value).length === 0)
      )
      .forEach(([key, value]) => {
        const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        formatted[label] = formatValue(key, value);
      });

    return formatted;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {talent.full_name?.charAt(0) || 'T'}
              </div>
              <div>
                <CardTitle className="text-lg">{talent.full_name || 'Nama tidak tersedia'}</CardTitle>
                <p className="text-sm text-gray-600">ID: {talent.id.slice(0, 8)}...</p>
                <p className="text-xs text-gray-500">Terdaftar: {new Date(talent.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(talent.verification_status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Informasi Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{talent.email}</span>
              </div>
              {talent.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>{talent.phone}</span>
                </div>
              )}
              {talent.age && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{talent.age} tahun</span>
                </div>
              )}
              {(talent.location || talent.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{talent.location || talent.city}</span>
                </div>
              )}
              {talent.zodiac && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span>Zodiak: {talent.zodiac}</span>
                </div>
              )}
              {talent.love_language && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-blue-600" />
                  <span>Love Language: {talent.love_language}</span>
                </div>
              )}
            </div>
            {talent.bio && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm break-words overflow-hidden"><strong>Bio:</strong> {talent.bio}</p>
              </div>
            )}
          </div>

          {/* Service Information Section */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-green-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Informasi Layanan & Tarif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {talent.hourly_rate && (
                <div>
                  <strong>Tarif per Jam:</strong> Rp {talent.hourly_rate.toLocaleString()} 
                </div>
              )}
              {talent.experience_years && (
                <div>
                  <strong>Pengalaman:</strong> {talent.experience_years} tahun
                </div>
              )}
              {talent.transportation_mode && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-green-600" />
                  <span>Transportasi: {talent.transportation_mode}</span>
                </div>
              )}
            </div>
            
            {talent.services && talent.services.length > 0 && (
              <div className="mt-3">
                <strong className="text-sm">Layanan yang Ditawarkan:</strong>
                <div className="flex flex-wrap gap-1 mt-2">
                  {talent.services.map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {talent.languages && talent.languages.length > 0 && (
              <div className="mt-3">
                <strong className="text-sm">Bahasa yang Dikuasai:</strong>
                <div className="flex flex-wrap gap-1 mt-2">
                  {talent.languages.map((language: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Availability & Activities Section */}
          {talent.availability && talent.availability.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-purple-900 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Aktivitas & Ketersediaan
              </h3>
              <div className="flex flex-wrap gap-1">
                {talent.availability.map((activity: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                    {activity}
                  </Badge>
                ))}
              </div>
              {talent.party_buddy_eligible && (
                <div className="mt-2 p-2 bg-purple-100 rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Tersedia untuk Party Buddy</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency Contact Section */}
          {(talent.emergency_contact || talent.emergency_phone) && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-orange-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Kontak Darurat
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {talent.emergency_contact && (
                  <div>
                    <strong>Nama:</strong> {talent.emergency_contact}
                  </div>
                )}
                {talent.emergency_phone && (
                  <div>
                    <strong>Nomor:</strong> {talent.emergency_phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Status Section */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-yellow-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Status Dokumen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KTP/ID Card */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  <span className="text-sm font-medium">KTP/ID Card:</span>
                </div>
                {(() => {
                  const idCardDoc = getDocumentByType('id_card');
                  const documentUrl = documentUrls.id_card;

                  console.log('🔍 [TalentApproval] ID Card check:', {
                    hasIdCardDoc: !!idCardDoc,
                    hasDocumentUrl: !!documentUrl,
                    isBase64: documentUrl?.startsWith('data:image/') || false,
                    docLength: documentUrl?.length || 0
                  });

                  if (loadingDocuments) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">⏳ Memuat...</Badge>
                        <p className="text-xs text-gray-500">Mencari dokumen...</p>
                      </div>
                    );
                  }

                  // Check if we have actual base64 document
                  if (documentUrl && documentUrl.startsWith('data:image/')) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-700 text-xs">✅ Dokumen Tersedia</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(documentUrl, 'id_card')}
                          className="flex items-center gap-1 text-xs h-7"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat KTP
                        </Button>
                      </div>
                    );
                  }

                  // Check if document exists in database but has invalid data
                  if (idCardDoc) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-orange-100 text-orange-700 text-xs">⚠️ Tercatat tapi tidak ditemukan</Badge>
                        <p className="text-xs text-orange-600">
                          Dokumen tercatat di database tapi data tidak valid.
                          {documentUrl ? `URL: ${documentUrl.substring(0, 30)}...` : 'URL kosong'}
                        </p>
                      </div>
                    );
                  }

                  // No document found at all
                  return <Badge className="bg-red-100 text-red-700 text-xs">❌ Belum Upload</Badge>;
                })()}
              </div>

              {/* Profile Photo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Foto Profil:</span>
                </div>
                {(() => {
                  const profileDoc = getDocumentByType('profile_photo');
                  const documentUrl = documentUrls.profile_photo;

                  console.log('🔍 [TalentApproval] Profile Photo check:', {
                    hasProfileDoc: !!profileDoc,
                    hasDocumentUrl: !!documentUrl,
                    isBase64: documentUrl?.startsWith('data:image/') || false,
                    docLength: documentUrl?.length || 0
                  });

                  if (loadingDocuments) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">⏳ Memuat...</Badge>
                        <p className="text-xs text-gray-500">Mencari dokumen...</p>
                      </div>
                    );
                  }

                  // Check if we have actual base64 document
                  if (documentUrl && documentUrl.startsWith('data:image/')) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-700 text-xs">✅ Dokumen Tersedia</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(documentUrl, 'profile_photo')}
                          className="flex items-center gap-1 text-xs h-7"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat Foto
                        </Button>
                      </div>
                    );
                  }

                  // Check if document exists in database but has invalid data
                  if (profileDoc) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-orange-100 text-orange-700 text-xs">⚠️ Tercatat tapi tidak ditemukan</Badge>
                        <p className="text-xs text-orange-600">
                          Dokumen tercatat di database tapi data tidak valid.
                          {documentUrl ? `URL: ${documentUrl.substring(0, 30)}...` : 'URL kosong'}
                        </p>
                      </div>
                    );
                  }

                  // No document found at all
                  return <Badge className="bg-red-100 text-red-700 text-xs">❌ Belum Upload</Badge>;
                })()}
              </div>
            </div>

            {documents.length > 0 ? (
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm font-medium mb-2">📋 Informasi Dokumen:</p>
                <div className="text-xs text-gray-600 space-y-1">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{doc.document_type}: {doc.status}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                <p className="text-sm font-medium mb-1 text-orange-800">⚠️ Perhatian:</p>
                <p className="text-xs text-orange-700">
                  Tidak ada dokumen yang tersimpan di database. Kemungkinan dokumen hanya tercatat di metadata tetapi tidak diupload dengan benar ke storage.
                </p>
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Status Pendaftaran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Data Profile:</strong> {talent.signup_completed ? '✅ Lengkap' : '⚠️ Tidak Lengkap'}
              </div>
              <div>
                <strong>Password:</strong> {talent.password_created ? '✅ Sudah Dibuat' : '❌ Belum Dibuat'}
              </div>
              {talent.auth_only && (
                <div className="md:col-span-2">
                  <Badge className="bg-orange-100 text-orange-700">⚠️ Auth Only - Belum ada data profile lengkap</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Detail Lengkap
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detail Lengkap - {talent.full_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* User-friendly formatted data */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 text-blue-900">📋 Informasi Profile Lengkap</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(formatProfileData()).map(([label, value]) => (
                        <div key={label} className="space-y-1">
                          <div className="font-medium text-sm text-gray-700">{label}:</div>
                          <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                            {String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* System information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 text-gray-900">🔧 Informasi Sistem</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><strong>User ID:</strong> {talent.id}</div>
                      <div><strong>Email:</strong> {talent.email}</div>
                      <div><strong>Status Verifikasi:</strong> {talent.verification_status}</div>
                      <div><strong>Tipe User:</strong> {talent.user_type}</div>
                      <div><strong>Tanggal Daftar:</strong> {new Date(talent.created_at).toLocaleString('id-ID')}</div>
                      <div><strong>Terakhir Update:</strong> {talent.updated_at ? new Date(talent.updated_at).toLocaleString('id-ID') : 'Tidak ada'}</div>
                      <div><strong>Auth Only:</strong> {talent.auth_only ? 'Ya' : 'Tidak'}</div>
                      <div><strong>Has Profile:</strong> {talent.has_profile ? 'Ya' : 'Tidak'}</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {talent.verification_status === 'pending' && (
              <>
                <Button
                  onClick={() => onApprove(talent.id)}
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Setujui
                </Button>
                
                <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tolak Pendaftaran Talent</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p>Apakah Anda yakin ingin menolak pendaftaran {talent.full_name}?</p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700 font-medium mb-2">
                          ⚠️ PERINGATAN: Menolak talent akan menghapus SEMUA data mereka dari sistem:
                        </p>
                        <ul className="text-xs text-red-600 space-y-1 ml-4">
                          <li>• Profil dan informasi pribadi</li>
                          <li>• Dokumen verifikasi (KTP, foto profil)</li>
                          <li>• File yang diupload ke storage</li>
                          <li>• Akun autentikasi</li>
                        </ul>
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          User dapat mendaftar ulang dengan data bersih jika diperlukan.
                        </p>
                      </div>
                      <Textarea
                        placeholder="Alasan penolakan (opsional)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleReject} variant="destructive">
                          Ya, Tolak & Hapus Data
                        </Button>
                        <Button onClick={() => setShowRejectionDialog(false)} variant="outline">
                          Batal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {talent.verification_status === 'verified' && (
              <Badge className="bg-green-100 text-green-700 px-3 py-1">
                ✅ Talent Aktif
              </Badge>
            )}

            {talent.verification_status === 'rejected' && (
              <Badge className="bg-red-100 text-red-700 px-3 py-1">
                ❌ Sudah Ditolak
              </Badge>
            )}

            {/* Delete button - available for all statuses if onDelete is provided */}
            {onDelete && (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                onClick={() => {
                  const confirmMessage = `⚠️ PERINGATAN: Anda akan menghapus PERMANEN talent ini!\n\nNama: ${talent.full_name || 'Unknown'}\nEmail: ${talent.email}\nStatus: ${talent.verification_status}\n\nSemua data termasuk:\n- Profil talent\n- Dokumen verifikasi\n- Riwayat booking\n- Data transaksi\n- Review dan rating\n\nAksi ini TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin ingin melanjutkan?`;

                  if (window.confirm(confirmMessage)) {
                    onDelete(talent.id, talent.full_name || talent.name || 'Unknown');
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Hapus Permanen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreviewModal
          document={{
            id: 'temp',
            document_type: selectedDocument.type,
            document_url: selectedDocument.url,
            status: 'pending',
            created_at: new Date().toISOString(),
            file_name: selectedDocument.type
          }}
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDocument(null);
          }}
          onApprove={() => {
            // Handle approval logic if needed
            setShowDocumentModal(false);
            setSelectedDocument(null);
          }}
          onReject={() => {
            // Handle rejection logic if needed
            setShowDocumentModal(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
};

export default TalentApprovalCard;
