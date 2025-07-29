
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Calendar, MapPin, CreditCard, Shield, Clock, FileText, Eye } from 'lucide-react';
import { AdminUser } from '@/services/adminUserService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DocumentPreviewModal from './DocumentPreviewModal';

interface UserDetailModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
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

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const { toast } = useToast();



  // Function to try linking orphaned documents to the correct user
  const tryLinkOrphanedDocuments = async (currentUser: any, orphanedDocs: any[]) => {
    try {
      console.log('🔗 [UserDetailModal] Attempting to link orphaned documents...');

      // Check localStorage for talent applications that might match this user
      const talentApplications = JSON.parse(localStorage.getItem('talent-applications') || '[]');
      console.log('🔍 [UserDetailModal] Found talent applications:', talentApplications.length);

      // Find application by email
      const matchingApp = talentApplications.find((app: any) =>
        app.personalInfo?.email === currentUser.email
      );

      console.log('🔍 [UserDetailModal] Matching application search result:', matchingApp);
      console.log('🔍 [UserDetailModal] Application has tempUserId?', !!matchingApp?.tempUserId);
      console.log('🔍 [UserDetailModal] Application tempUserId:', matchingApp?.tempUserId);

      if (matchingApp) {
        // Check if application has documents in localStorage
        if (matchingApp.documents && (matchingApp.documents.idCard || matchingApp.documents.profilePhoto)) {
          console.log('✅ [UserDetailModal] Found application with documents in localStorage');
          console.log('🔍 [UserDetailModal] Documents available:', {
            idCard: !!matchingApp.documents.idCard,
            profilePhoto: !!matchingApp.documents.profilePhoto
          });

          // Save documents from localStorage to database with correct user ID
          let documentsCreated = 0;

          // Save ID Card
          if (matchingApp.documents.idCard) {
            console.log('💾 [UserDetailModal] Saving ID Card to database...');
            const { error: idError } = await supabase
              .from('verification_documents')
              .upsert({
                user_id: currentUser.id,
                document_type: 'id_card',
                document_url: matchingApp.documents.idCard,
                file_name: matchingApp.documents.idCardName || 'id_card.jpg',
                file_size: 0,
                content_type: 'image/jpeg',
                status: 'pending'
              }, {
                onConflict: 'user_id,document_type'
              });

            if (idError) {
              console.error('❌ [UserDetailModal] Error saving ID card:', idError);
            } else {
              console.log('✅ [UserDetailModal] Successfully saved ID card');
              documentsCreated++;
            }
          }

          // Save Profile Photo
          if (matchingApp.documents.profilePhoto) {
            console.log('💾 [UserDetailModal] Saving Profile Photo to database...');
            const { error: photoError } = await supabase
              .from('verification_documents')
              .upsert({
                user_id: currentUser.id,
                document_type: 'profile_photo',
                document_url: matchingApp.documents.profilePhoto,
                file_name: matchingApp.documents.profilePhotoName || 'profile_photo.jpg',
                file_size: 0,
                content_type: 'image/jpeg',
                status: 'pending'
              }, {
                onConflict: 'user_id,document_type'
              });

            if (photoError) {
              console.error('❌ [UserDetailModal] Error saving profile photo:', photoError);
            } else {
              console.log('✅ [UserDetailModal] Successfully saved profile photo');
              documentsCreated++;
            }
          }

          if (documentsCreated > 0) {
            console.log(`🎉 [UserDetailModal] Successfully created ${documentsCreated} documents for user`);
            // Refresh documents after creating - but let's add more debugging
            console.log('🔄 [UserDetailModal] Refreshing documents after creation...');

            // Add a longer delay and more debugging
            setTimeout(async () => {
              console.log('🔄 [UserDetailModal] Starting delayed refresh...');
              await fetchUserDocuments();
              console.log('🔄 [UserDetailModal] Delayed refresh completed');
            }, 2000); // Increased delay to 2 seconds
          }
        } else {
          console.log('⚠️ [UserDetailModal] Application found but no documents in localStorage');
        }
      } else {
        console.log('⚠️ [UserDetailModal] No matching application found or no tempUserId');
        if (matchingApp) {
          console.log('🔍 [UserDetailModal] Application structure:', Object.keys(matchingApp));
          console.log('🔍 [UserDetailModal] Full application data:', matchingApp);
        }
      }
    } catch (error) {
      console.error('❌ [UserDetailModal] Error linking orphaned documents:', error);
    }
  };

  const fetchUserDocuments = async () => {
    if (!user) return;

    setLoadingDocuments(true);
    try {
      console.log('🔍 [UserDetailModal] Fetching documents for user:', user.id);
      console.log('🔍 [UserDetailModal] User object keys:', Object.keys(user));
      console.log('🔍 [UserDetailModal] User object:', user);
      console.log('🔍 [UserDetailModal] User.id type:', typeof user.id);
      console.log('🔍 [UserDetailModal] User.id length:', user.id?.length);

      const { data: docs, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [UserDetailModal] Error fetching documents:', error);
        return;
      }

      console.log('📄 [UserDetailModal] Documents found:', docs?.length || 0);
      console.log('📄 [UserDetailModal] Documents data:', docs);

      // Add detailed logging for each document
      if (docs && docs.length > 0) {
        docs.forEach((doc, index) => {
          console.log(`📄 [UserDetailModal] Document ${index + 1}:`, {
            id: doc.id,
            user_id: doc.user_id,
            document_type: doc.document_type,
            status: doc.status,
            file_name: doc.file_name,
            has_url: !!doc.document_url,
            url_length: doc.document_url?.length || 0
          });
        });
      }

      // Also check all documents in the table for debugging
      const { data: allDocs, error: allDocsError } = await supabase
        .from('verification_documents')
        .select('*');

      console.log('📄 [UserDetailModal] ALL documents in table:', allDocs?.length || 0);
      console.log('📄 [UserDetailModal] ALL documents data:', allDocs);

      // Debug: Show user IDs in documents vs current user ID
      if (allDocs && allDocs.length > 0) {
        console.log('🔍 [UserDetailModal] Current user ID:', user.id);
        console.log('🔍 [UserDetailModal] Document user IDs:', allDocs.map(doc => doc.user_id));
        console.log('🔍 [UserDetailModal] User ID match check:', allDocs.map(doc => ({
          doc_user_id: doc.user_id,
          current_user_id: user.id,
          matches: doc.user_id === user.id
        })));

        // Try to find documents that might belong to this user by email
        console.log('🔍 [UserDetailModal] Checking for orphaned documents by email...');
        const orphanedDocs = allDocs.filter(doc => doc.user_id !== user.id);
        const userDocs = allDocs.filter(doc => doc.user_id === user.id);

        if (orphanedDocs.length > 0 && userDocs.length === 0) {
          // Only try to link if user has no documents yet
          console.log('🔍 [UserDetailModal] Found orphaned documents:', orphanedDocs.length);
          console.log('🔍 [UserDetailModal] User email:', user.email);
          console.log('🔍 [UserDetailModal] User has no existing documents, attempting to link...');

          // Check if we can link these documents to this user
          await tryLinkOrphanedDocuments(user, orphanedDocs);
        } else if (userDocs.length > 0) {
          console.log('✅ [UserDetailModal] User already has documents, skipping linking process');
        }
      }

      setDocuments(docs || []);
      console.log('📄 [UserDetailModal] Documents state updated with:', docs?.length || 0, 'documents');
    } catch (error) {
      console.error('❌ [UserDetailModal] Exception fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fetch user documents when modal opens - MUST be before early return
  useEffect(() => {
    if (isOpen && user) {
      fetchUserDocuments();
    }
  }, [isOpen, user]);

  if (!user) {
    return null;
  }



  const handleViewDocument = (document: VerificationDocument) => {
    console.log('👁️ [UserDetailModal] Viewing document:', document.id);

    // Create document object compatible with DocumentPreviewModal
    const documentData = {
      id: document.id,
      document_type: document.document_type,
      document_url: document.document_url || '',
      status: document.status || 'pending',
      file_name: document.file_name || 'Unknown',
      file_size: document.file_size || 0,
      content_type: document.content_type || 'image/jpeg',
      user_name: user?.name || 'Unknown',
      user_email: user?.email || 'Unknown',
      created_at: document.created_at,
    };

    setSelectedDocument(documentData);
    setShowDocumentModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'companion':
        return <Badge className="bg-purple-100 text-purple-600">Talent</Badge>;
      case 'admin':
        return <Badge className="bg-red-100 text-red-600">Admin</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-600">User</Badge>;
    }
  };

  const getStatusBadge = (status: string, authOnly: boolean) => {
    if (authOnly) {
      return <Badge className="bg-orange-100 text-orange-600">Auth Only</Badge>;
    }
    
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-600">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-600">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-600">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>;
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detail User: {user.name || 'No name'}
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap pengguna dalam sistem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-hidden">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Dasar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Email:</span>
                  <span className="break-all">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium flex-shrink-0">Telepon:</span>
                    <span className="break-all">{user.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Terdaftar:</span>
                  <span>{new Date(user.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Tipe User:</span>
                  {getUserTypeBadge(user.user_type)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(user.verification_status, user.auth_only)}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium">ID:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded break-all">
                    {user.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Information (for talents) */}
          {user.user_type === 'companion' && user.has_profile && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informasi Talent</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.age && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Usia:</span>
                    <span>{user.age} tahun</span>
                  </div>
                )}
                
                {user.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium flex-shrink-0">Lokasi:</span>
                    <span className="break-words">{user.location}</span>
                  </div>
                )}
                
                {user.hourly_rate && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Tarif per Jam:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(user.hourly_rate)}
                    </span>
                  </div>
                )}
              </div>
              
              {user.bio && (
                <div className="col-span-full">
                  <span className="font-medium">Bio:</span>
                  <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded break-words whitespace-pre-wrap">
                    {user.bio}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status Akun</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="font-medium">Data Source:</span>
                <div className="mt-1">
                  {user.has_profile && user.auth_only ? (
                    <Badge variant="secondary">Auth + Profile</Badge>
                  ) : user.has_profile ? (
                    <Badge className="bg-green-100 text-green-600">Profile Only</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-600">Auth Only</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="font-medium">Account Status:</span>
                <div className="mt-1">
                  <Badge className={
                    user.status === 'active' 
                      ? "bg-green-100 text-green-600" 
                      : "bg-gray-100 text-gray-600"
                  }>
                    {user.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Data (if available) */}
          {(user.profile_data || user.raw_user_meta_data) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Profile Lengkap</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                {(() => {
                  try {
                    // Try profile_data first, then raw_user_meta_data
                    let profileData = null;

                    console.log('🔍 [UserDetailModal] Processing profile data for user:', user.id);
                    console.log('🔍 [UserDetailModal] user.profile_data:', user.profile_data);
                    console.log('🔍 [UserDetailModal] user.raw_user_meta_data:', user.raw_user_meta_data);

                    if (user.profile_data) {
                      try {
                        if (typeof user.profile_data === 'string') {
                          profileData = JSON.parse(user.profile_data);
                        } else {
                          profileData = user.profile_data;
                        }
                      } catch (parseError) {
                        console.error('❌ [UserDetailModal] Error parsing profile_data:', parseError);
                        profileData = null;
                      }
                    }

                    if (!profileData && user.raw_user_meta_data) {
                      profileData = user.raw_user_meta_data;
                    }

                    if (!profileData) {
                      return <div className="text-sm text-gray-500">Tidak ada data profile tersedia</div>;
                    }

                    console.log('✅ [UserDetailModal] Successfully processed profile data:', profileData);
                    console.log('✅ [UserDetailModal] Profile data keys:', Object.keys(profileData));
                    console.log('✅ [UserDetailModal] Profile data entries count:', Object.entries(profileData).length);
                    
                    // Format field labels to be more user-friendly
                    const formatLabel = (key: string) => {
                      const labelMap: { [key: string]: string } = {
                        'full_name': 'Nama Lengkap',
                        'phone': 'Nomor Telepon',
                        'age': 'Usia',
                        'location': 'Lokasi',
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
                        'city': 'Kota',
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
                        'rentLoverDetails': 'Detail Rent Lover'
                      };
                      return labelMap[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
                        if (key === 'rentLoverDetails') {
                          const details = value;
                          return `Harga: ${formatValue('rate', details.price)}, Deskripsi: ${details.description || 'Tidak ada'}, Termasuk: ${details.inclusions?.join(', ') || 'Tidak ada'}`;
                        }
                        if (key.toLowerCase().includes('rates')) {
                          return Object.entries(value).map(([k, v]) => `${k}: ${formatValue('rate', v)}`).join(', ');
                        }
                        if (key === 'availability' && value.general) {
                          return `Umum: ${value.general?.join(', ') || 'Tidak ada'}, Party Buddy: ${value.partyBuddy?.available ? 'Ya' : 'Tidak'}`;
                        }
                        return JSON.stringify(value, null, 2);
                      }
                      
                      return String(value);
                    };

                    // Filter out sensitive or irrelevant data
                    const skipKeys = ['idCardFile', 'profilePhotoFile', 'sub', 'email_verified', 'phone_verified', 'registrationTimestamp', 'formVersion', 'aud', 'exp', 'iat', 'iss'];

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(profileData)
                          .filter(([key, value]) =>
                            !skipKeys.includes(key) &&
                            value !== null &&
                            value !== undefined &&
                            value !== '' &&
                            !(typeof value === 'object' && Object.keys(value).length === 0)
                          )
                          .map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="font-medium text-sm text-gray-700">
                              {formatLabel(key)}:
                            </div>
                            <div className="text-sm text-gray-600 bg-white p-2 rounded border break-words whitespace-pre-wrap overflow-hidden">
                              {formatValue(key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } catch (error) {
                    console.error('❌ [UserDetailModal] Error processing profile data:', error);
                    return (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                        <div>⚠️ Gagal memproses data profile: Format data tidak valid</div>
                        <div className="text-xs mt-1 text-gray-600">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>
                        <div className="text-xs mt-1">
                          <strong>Debug Info:</strong>
                          <br />• profile_data: {user.profile_data ? 'Available' : 'Not available'}
                          <br />• raw_user_meta_data: {user.raw_user_meta_data ? 'Available' : 'Not available'}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {/* User Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dokumen Verifikasi
            </h3>

            {loadingDocuments ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">Memuat dokumen...</div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">Tidak ada dokumen yang diupload</div>
                <div className="text-xs text-gray-400 mt-2">
                  Debug: Mencari dokumen untuk user ID: {user?.id}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {doc.document_type === 'id_card' ? 'KTP/ID Card' : 'Foto Profil'}
                          </h4>
                          <Badge
                            className={
                              (doc.status === 'verified' || doc.status === 'approved')
                                ? "bg-green-100 text-green-600"
                                : doc.status === 'rejected'
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                            }
                          >
                            {(doc.status === 'verified' || doc.status === 'approved') ? 'Terverifikasi' :
                             doc.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>File:</strong> {doc.file_name || 'Unknown'}</p>
                          <p><strong>Size:</strong> {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'Unknown'}</p>
                          <p><strong>Upload:</strong> {new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                          <p><strong>Storage:</strong> {doc.document_url?.startsWith('data:') ? 'Database (Aman)' : 'Legacy Storage'}</p>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Sistem</h3>
            
            <div className="text-sm space-y-2">
              <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString('id-ID')}</div>
              {user.updated_at && (
                <div><strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleString('id-ID')}</div>
              )}
              <div><strong>Has Profile:</strong> {user.has_profile ? 'Yes' : 'No'}</div>
              <div><strong>Auth Only:</strong> {user.auth_only ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Document Preview Modal */}
    {selectedDocument && (
      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedDocument(null);
        }}
      />
    )}
  </>
  );
};

export default UserDetailModal;
