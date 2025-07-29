import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Clock, CheckCircle, XCircle, User, Search, Filter, RefreshCw, 
  AlertTriangle, FileCheck, Users, Eye, FileText, Camera, 
  Mail, Phone, MapPin, Calendar, Heart, Star, Briefcase, Car, 
  IdCard, Activity, Gift, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TalentProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  age?: number;
  location?: string;
  city?: string;
  bio?: string;
  hourly_rate?: number;
  services?: string[];
  languages?: string[];
  availability?: string[];
  experience_years?: number;
  transportation_mode?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  zodiac?: string;
  love_language?: string;
  verification_status: string;
  user_type: string;
  created_at: string;
  updated_at?: string;
  profile_data?: any; // Changed from string to any to handle JSON data
  raw_user_meta_data?: any;
  signup_completed?: boolean;
  password_created?: boolean;
  has_profile?: boolean;
  auth_only?: boolean;
  party_buddy_eligible?: boolean;
}

interface DocumentData {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  file_name?: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
}

const NewTalentApprovalSystem = () => {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentViewModal, setDocumentViewModal] = useState<{show: boolean, url: string, type: string}>({
    show: false, url: '', type: ''
  });
  const { toast } = useToast();

  // Fetch talents from localStorage first, then database
  const fetchTalents = async () => {
    try {
      setLoading(true);
      console.log('🔍 [NewTalentApproval] Fetching talents...');

      // First check localStorage for new applications
      const localApplications = localStorage.getItem('talent-applications');
      if (localApplications) {
        const applications = JSON.parse(localApplications);
        console.log('✅ [NewTalentApproval] Found localStorage applications:', applications.length);

        if (applications.length > 0) {
          // Transform localStorage data to match our interface
          const transformedTalents: TalentProfile[] = applications.map((app: any) => ({
            id: app.id,
            full_name: app.personalInfo?.name || 'Unknown',
            email: app.personalInfo?.email || 'No email',
            phone: app.personalInfo?.phone || 'No phone',
            age: app.personalInfo?.age || 0,
            location: app.personalInfo?.location || 'Unknown',
            bio: app.personalInfo?.bio || '',
            available_services: app.services?.availableServices || [],
            verification_status: app.status === 'pending_admin_review' ? 'pending' : app.status,
            created_at: app.timestamp || new Date().toISOString(),
            rent_lover_rate: app.services?.rentLoverDetails?.dailyRate || 0,
            party_buddy_available: app.services?.partyBuddyAvailable || false,
            offline_date_availability: app.services?.offlineDateAvailability || {},
            date_interests: app.services?.dateInterests || [],
            user_type: 'talent',
            // Add document info for localStorage data
            localDocuments: app.documents || {}
          }));

          setTalents(transformedTalents);
          setLoading(false);
          return;
        }
      }

      // Fallback to database if no localStorage data
      console.log('🔍 [NewTalentApproval] No localStorage data, checking database...');
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_type', 'admin') // Exclude admin users
        .or('verification_status.is.null,verification_status.eq.pending,verification_status.eq.verified') // Include new registrations and active statuses
        .order('created_at', { ascending: false });

      console.log('🔍 [NewTalentApproval] Fetched profiles:', profilesData?.map(p => ({
        id: p.id.slice(0, 8),
        email: p.email,
        name: p.full_name,
        status: p.verification_status,
        user_type: p.user_type,
        created_at: p.created_at
      })));

      if (error) {
        console.error('❌ [NewTalentApproval] Error fetching talents:', error);
        throw error;
      }

      console.log('✅ [NewTalentApproval] Raw profiles data:', profilesData?.length || 0);
      setTalents((profilesData || []) as TalentProfile[]);
      
    } catch (error: any) {
      console.error('❌ [NewTalentApproval] Fetch error:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data talent",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents for a specific talent (localStorage first, then database)
  const fetchTalentDocuments = async (talentId: string): Promise<DocumentData[]> => {
    try {
      console.log('📄 [NewTalentApproval] Fetching documents for:', talentId);

      // First check localStorage
      const localApplications = localStorage.getItem('talent-applications');
      if (localApplications) {
        const applications = JSON.parse(localApplications);
        const app = applications.find((a: any) => a.id === talentId);

        if (app && app.documents) {
          console.log('✅ [NewTalentApproval] Found localStorage documents for:', talentId);
          const docs: DocumentData[] = [];

          if (app.documents.idCard) {
            docs.push({
              id: `${talentId}_id_card`,
              user_id: talentId,
              document_type: 'id_card',
              document_url: app.documents.idCard,
              file_name: app.documents.idCardName || 'id_card.jpg',
              status: 'pending',
              created_at: app.timestamp || new Date().toISOString(),
              updated_at: app.timestamp || new Date().toISOString()
            });
          }

          if (app.documents.profilePhoto) {
            docs.push({
              id: `${talentId}_profile_photo`,
              user_id: talentId,
              document_type: 'profile_photo',
              document_url: app.documents.profilePhoto,
              file_name: app.documents.profilePhotoName || 'profile_photo.jpg',
              status: 'pending',
              created_at: app.timestamp || new Date().toISOString(),
              updated_at: app.timestamp || new Date().toISOString()
            });
          }

          return docs;
        }
      }

      // Fallback to database
      const { data: documents, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', talentId);

      if (error) {
        console.error('❌ [NewTalentApproval] Document fetch error:', error);
        return [];
      }

      console.log('✅ [NewTalentApproval] Found database documents:', documents?.length || 0);
      return documents || [];

    } catch (error) {
      console.error('❌ [NewTalentApproval] Document fetch error:', error);
      return [];
    }
  };

  // Handle talent approval/rejection
  const handleTalentAction = async (talentId: string, approved: boolean, reason?: string) => {
    try {
      console.log(`🔄 [NewTalentApproval] ${approved ? 'Approving' : 'Rejecting'} talent:`, talentId);
      
      if (approved) {
        // If approved, update status normally
        const { data, error } = await supabase.functions.invoke('admin-update-talent-status', {
          body: { 
            talentId, 
            approved,
            rejectionReason: reason 
          }
        });

        if (error) throw error;

        toast({
          title: "✅ Talent Disetujui",
          description: "Pendaftaran talent telah disetujui dan diaktifkan.",
          className: "bg-green-50 border-green-200"
        });

      } else {
        // If rejected, completely delete all data
        console.log('🗑️ [NewTalentApproval] Completely deleting rejected talent data...');

        // First check if this is localStorage data
        const localApplications = localStorage.getItem('talent-applications');
        if (localApplications) {
          const applications = JSON.parse(localApplications);
          const appExists = applications.find((a: any) => a.id === talentId);

          if (appExists) {
            // Remove from localStorage
            const updatedApps = applications.filter((app: any) => app.id !== talentId);
            localStorage.setItem('talent-applications', JSON.stringify(updatedApps));

            // Also remove from admin queue if exists
            const adminQueue = JSON.parse(localStorage.getItem('admin-talent-queue') || '[]');
            const updatedQueue = adminQueue.filter((item: any) => item.id !== talentId);
            localStorage.setItem('admin-talent-queue', JSON.stringify(updatedQueue));

            console.log('✅ [NewTalentApproval] LocalStorage data deleted for:', talentId);

            // Remove from local state
            setTalents(prev => prev.filter(talent => talent.id !== talentId));

            toast({
              title: "🗑️ Talent Ditolak & Dihapus",
              description: "Talent ditolak dan semua data telah dihapus dari sistem. Mereka dapat mendaftar ulang.",
              className: "bg-red-50 border-red-200"
            });

            return; // Exit early for localStorage data
          }
        }

        // Fallback to Supabase deletion for database records
        try {
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: talentId }
          });

          if (deleteError) {
            console.error('❌ [NewTalentApproval] Edge function error:', deleteError);
            
            // Fallback: Try direct database deletion
            console.log('🔄 [NewTalentApproval] Attempting fallback deletion...');
            
            // Delete from profiles table directly
            const { error: profileDeleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', talentId);

            if (profileDeleteError) {
              console.error('❌ [NewTalentApproval] Fallback profile deletion failed:', profileDeleteError);
              throw new Error('Failed to delete talent data: ' + profileDeleteError.message);
            }
            
            console.log('✅ [NewTalentApproval] Fallback deletion completed');
          } else {
            console.log('✅ [NewTalentApproval] Edge function deletion completed:', deleteResult);
          }

          // Remove talent from state local immediately after successful deletion
          console.log('🔄 [NewTalentApproval] Removing talent from local state...');
          setTalents(prev => {
            const filtered = prev.filter(talent => talent.id !== talentId);
            console.log('📊 [NewTalentApproval] Updated local state:', {
              before: prev.length,
              after: filtered.length,
              removedId: talentId.slice(0, 8)
            });
            return filtered;
          });

        } catch (deleteError) {
          console.error('❌ [NewTalentApproval] Complete deletion failed:', deleteError);
          throw deleteError;
        }

        toast({
          title: "🗑️ Talent Ditolak & Dihapus",
          description: "Talent ditolak dan semua data telah dihapus dari sistem.",
          className: "bg-red-50 border-red-200"
        });
      }

      // Only refresh if approval (since rejection removes from local state)
      if (approved) {
        await fetchTalents();
      }
      
    } catch (error: any) {
      console.error('❌ [NewTalentApproval] Action error:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  // Filter talents based on search and status
  const filteredTalents = talents.filter(talent => {
    const matchesSearch = !searchTerm || 
      talent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || talent.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Parse profile data safely
  const parseProfileData = (talent: TalentProfile) => {
    try {
      if (talent.profile_data) {
        return JSON.parse(talent.profile_data);
      }
      return talent.raw_user_meta_data || {};
    } catch (error) {
      console.warn('Failed to parse profile data:', error);
      return talent.raw_user_meta_data || {};
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Menunggu Review</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Memuat data talent...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sistem Persetujuan Talent Baru
          </CardTitle>
          <p className="text-sm text-gray-600">
            Kelola persetujuan pendaftaran talent baru dengan sistem dokumen yang disempurnakan
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau email talent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu Review</SelectItem>
                <SelectItem value="verified">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchTalents} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{talents.length}</div>
                <div className="text-sm text-gray-600">Total Talent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {talents.filter(t => t.verification_status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Menunggu Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {talents.filter(t => t.verification_status === 'verified').length}
                </div>
                <div className="text-sm text-gray-600">Disetujui</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {talents.filter(t => t.verification_status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-600">Ditolak</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Talents List */}
      <div className="space-y-4">
        {filteredTalents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada talent yang ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          filteredTalents.map((talent) => (
            <TalentCard 
              key={talent.id} 
              talent={talent}
              onApprove={(id) => handleTalentAction(id, true)}
              onReject={(id, reason) => handleTalentAction(id, false, reason)}
              onViewDetails={(talent) => {
                setSelectedTalent(talent);
                setShowDetailsModal(true);
              }}
              onViewDocument={(url, type) => {
                setDocumentViewModal({ show: true, url, type });
              }}
              fetchDocuments={fetchTalentDocuments}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {selectedTalent && (
        <TalentDetailsModal
          talent={selectedTalent}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTalent(null);
          }}
        />
      )}

      {documentViewModal.show && (
        <DocumentViewModal
          url={documentViewModal.url}
          type={documentViewModal.type}
          isOpen={documentViewModal.show}
          onClose={() => setDocumentViewModal({ show: false, url: '', type: '' })}
        />
      )}
    </div>
  );
};

// Individual Talent Card Component
const TalentCard: React.FC<{
  talent: TalentProfile;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onViewDetails: (talent: TalentProfile) => void;
  onViewDocument: (url: string, type: string) => void;
  fetchDocuments: (id: string) => Promise<DocumentData[]>;
}> = ({ talent, onApprove, onReject, onViewDetails, onViewDocument, fetchDocuments }) => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch documents when component mounts
  useEffect(() => {
    const loadDocuments = async () => {
      setLoadingDocs(true);
      const docs = await fetchDocuments(talent.id);
      setDocuments(docs);
      setLoadingDocs(false);
    };
    loadDocuments();
  }, [talent.id, fetchDocuments]);

  const profileData = React.useMemo(() => {
    try {
      if (talent.profile_data) {
        // Handle both string and already parsed JSON
        return typeof talent.profile_data === 'string' 
          ? JSON.parse(talent.profile_data) 
          : talent.profile_data;
      }
      return talent.raw_user_meta_data || {};
    } catch {
      return talent.raw_user_meta_data || {};
    }
  }, [talent.profile_data, talent.raw_user_meta_data]);

  const getDocumentByType = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const handleReject = () => {
    onReject(talent.id, rejectionReason);
    setShowRejectDialog(false);
    setRejectionReason('');
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
                <p className="text-sm text-gray-600">{talent.email}</p>
                <p className="text-xs text-gray-500">
                  Terdaftar: {new Date(talent.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
            <div className="text-right">
              {talent.verification_status === 'pending' && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />Menunggu Review
                </Badge>
              )}
              {talent.verification_status === 'verified' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />Disetujui
                </Badge>
              )}
              {talent.verification_status === 'rejected' && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />Ditolak
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{talent.phone || profileData.phone || 'Tidak tersedia'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{talent.age || profileData.personalInfo?.age || 'Tidak tersedia'} tahun</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{talent.location || talent.city || profileData.personalInfo?.location || 'Tidak tersedia'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-green-600" />
                <span>Rp {(talent.hourly_rate || profileData.services?.hourlyRate || 0).toLocaleString()}/jam</span>
              </div>
              {profileData.services?.availableServices && (
                <div className="flex flex-wrap gap-1">
                  {profileData.services.availableServices.slice(0, 3).map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {profileData.services.availableServices.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{profileData.services.availableServices.length - 3} lainnya
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Document Status */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-yellow-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Status Dokumen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Card */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  <span className="text-sm font-medium">KTP/ID Card:</span>
                </div>
                {loadingDocs ? (
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Memuat...
                  </Badge>
                ) : (() => {
                  const idDoc = getDocumentByType('id_card');
                  const hasIdFromMeta = profileData.documents?.hasIdCard || profileData.documents?.idCardUploaded;
                  
                  if (idDoc && idDoc.document_url && idDoc.document_url.startsWith('data:image/')) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-700 text-xs">✅ Tersedia</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDocument(idDoc.document_url, 'id_card')}
                          className="flex items-center gap-1 text-xs h-7"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat KTP
                        </Button>
                      </div>
                    );
                  } else if (hasIdFromMeta) {
                    return (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">⚠️ Tercatat tapi tidak ditemukan</Badge>
                    );
                  } else {
                    return (
                      <Badge className="bg-red-100 text-red-700 text-xs">❌ Belum Upload</Badge>
                    );
                  }
                })()}
              </div>

              {/* Profile Photo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Foto Profil:</span>
                </div>
                {loadingDocs ? (
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Memuat...
                  </Badge>
                ) : (() => {
                  const photoDoc = getDocumentByType('profile_photo');
                  const hasPhotoFromMeta = profileData.documents?.hasProfilePhoto || profileData.documents?.profilePhotoUploaded;
                  
                  if (photoDoc && photoDoc.document_url && photoDoc.document_url.startsWith('data:image/')) {
                    return (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-700 text-xs">✅ Tersedia</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDocument(photoDoc.document_url, 'profile_photo')}
                          className="flex items-center gap-1 text-xs h-7"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat Foto
                        </Button>
                      </div>
                    );
                  } else if (hasPhotoFromMeta) {
                    return (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">⚠️ Tercatat tapi tidak ditemukan</Badge>
                    );
                  } else {
                    return (
                      <Badge className="bg-red-100 text-red-700 text-xs">❌ Belum Upload</Badge>
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onViewDetails(talent)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Detail Lengkap
            </Button>

            {talent.verification_status === 'pending' && (
              <>
                <Button
                  onClick={() => onApprove(talent.id)}
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Setujui
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak & Hapus
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
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
              <Button onClick={() => setShowRejectDialog(false)} variant="outline">
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Talent Details Modal Component
const TalentDetailsModal: React.FC<{
  talent: TalentProfile;
  isOpen: boolean;
  onClose: () => void;
}> = ({ talent, isOpen, onClose }) => {
  const profileData = React.useMemo(() => {
    try {
      if (talent.profile_data) {
        // Handle both string and already parsed JSON
        return typeof talent.profile_data === 'string' 
          ? JSON.parse(talent.profile_data) 
          : talent.profile_data;
      }
      return talent.raw_user_meta_data || {};
    } catch {
      return talent.raw_user_meta_data || {};
    }
  }, [talent.profile_data, talent.raw_user_meta_data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Lengkap - {talent.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold mb-3 text-blue-900">👤 Informasi Personal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Nama:</strong> {talent.full_name}</div>
              <div><strong>Email:</strong> {talent.email}</div>
              <div><strong>Telepon:</strong> {talent.phone || profileData.phone || 'Tidak tersedia'}</div>
              <div><strong>Usia:</strong> {talent.age || profileData.personalInfo?.age || 'Tidak tersedia'}</div>
              <div><strong>Lokasi:</strong> {talent.location || profileData.personalInfo?.location || 'Tidak tersedia'}</div>
              <div><strong>Zodiak:</strong> {talent.zodiac || profileData.personalInfo?.zodiac || 'Tidak tersedia'}</div>
              <div><strong>Love Language:</strong> {talent.love_language || profileData.personalInfo?.loveLanguage || 'Tidak tersedia'}</div>
            </div>
            {(talent.bio || profileData.personalInfo?.bio) && (
              <div className="mt-3">
                <strong className="text-sm">Bio:</strong>
                <p className="text-sm mt-1 bg-white p-2 rounded break-words overflow-hidden">
                  {talent.bio || profileData.personalInfo?.bio}
                </p>
              </div>
            )}
          </div>

          {/* Services Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold mb-3 text-green-900">💼 Informasi Layanan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Tarif per Jam:</strong> Rp {(talent.hourly_rate || profileData.services?.hourlyRate || 0).toLocaleString()}</div>
              <div><strong>Pengalaman:</strong> {talent.experience_years || 'Tidak tersedia'} tahun</div>
              <div><strong>Transportasi:</strong> {talent.transportation_mode || profileData.additionalInfo?.transportationMode || 'Tidak tersedia'}</div>
            </div>
            {profileData.services?.availableServices && (
              <div className="mt-3">
                <strong className="text-sm">Layanan yang Ditawarkan:</strong>
                <div className="flex flex-wrap gap-1 mt-2">
                  {profileData.services.availableServices.map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold mb-3 text-gray-900">⚙️ Informasi Sistem</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><strong>User ID:</strong> {talent.id}</div>
              <div><strong>Status Verifikasi:</strong> {talent.verification_status}</div>
              <div><strong>Tipe User:</strong> {talent.user_type}</div>
              <div><strong>Tanggal Daftar:</strong> {new Date(talent.created_at).toLocaleString('id-ID')}</div>
              <div><strong>Signup Completed:</strong> {talent.signup_completed ? 'Ya' : 'Tidak'}</div>
              <div><strong>Has Profile:</strong> {talent.has_profile ? 'Ya' : 'Tidak'}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Document View Modal Component
const DocumentViewModal: React.FC<{
  url: string;
  type: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ url, type, isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'id_card' ? 'KTP/ID Card' : 'Foto Profil'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img 
            src={url} 
            alt={type}
            className="max-w-full max-h-96 object-contain rounded border"
            onError={(e) => {
              console.error('Failed to load image:', url);
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTalentApprovalSystem;