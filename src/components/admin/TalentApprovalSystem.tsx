

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, User, Search, Filter, RefreshCw, AlertTriangle, FileCheck, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TalentApprovalCard from './TalentApprovalCard';
import { adminUserService } from '@/services/adminUserService';

interface TalentRegistrationData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  age: number;
  location: string;
  bio: string;
  hourly_rate: number;
  services: string[];
  languages: string[];
  interests: string[];
  experience_years: number;
  transportation_mode: string;
  emergency_contact: string;
  emergency_phone: string;
  availability: string[];
  has_id_card: boolean;
  has_profile_photo: boolean;
  id_card_url?: string;
  profile_photo_url?: string;
  created_at: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  specialties?: string[];
  // Complete signup fields from the registration form
  city?: string;
  zodiac?: string;
  love_language?: string;
  party_buddy_eligible?: boolean;
  // Document fields
  profile_image?: string;
  documents?: any;
  // New comprehensive fields from signup process
  date_activities?: string[];
  party_buddy_available?: boolean;
  selected_services?: string[];
  service_rates?: { [key: string]: number };
  password_created?: boolean;
  signup_completed?: boolean;
}

const TalentApprovalSystem = () => {
  const [talents, setTalents] = useState<TalentRegistrationData[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<TalentRegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTalentRegistrations();
    setupRealTimeUpdates();

    // Auto-refresh every 30 seconds to catch new registrations and document uploads
    const refreshInterval = setInterval(() => {
      console.log('🔄 [TalentApproval] Auto-refreshing talent data...');
      fetchTalentRegistrations();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    filterTalents();
  }, [talents, searchTerm, statusFilter, serviceFilter]);

  const fetchTalentRegistrations = async () => {
    try {
      setLoading(true);
      console.log('🔍 [TalentApproval] Fetching comprehensive talent data...');

      // Get all users including auth-only users
      const { users, error } = await adminUserService.getAllUsers();
      
      if (error) {
        console.error('❌ [TalentApproval] Error fetching users:', error);
        throw new Error(error);
      }

      console.log('📊 [TalentApproval] All users received:', users.length);
      
      // Filter for companion users only - include all statuses for admin review
      // Note: We include rejected users in case they re-registered and need review
      const companionUsers = users.filter(user =>
        user.user_type === 'companion'
        // Removed rejection filter to allow re-registrations to appear
      );
      
      console.log('🎯 [TalentApproval] Active companion users found:', companionUsers.length);

      // Enhanced document detection from verification_documents table - get fresh data
      const { data: verificationDocs, error: docsError } = await supabase
        .from('verification_documents')
        .select('user_id, document_type, document_url, status, created_at, file_name, file_size')
        .order('created_at', { ascending: false });

      console.log('📁 [TalentApproval] Fresh verification documents query result:', {
        docsCount: verificationDocs?.length || 0,
        error: docsError,
        validBase64Docs: verificationDocs?.filter(doc => doc.document_url?.startsWith('data:image/')).length || 0
      });

      if (docsError) {
        console.error('❌ [TalentApproval] Error fetching verification documents:', docsError);
      }

      // Also check storage files to see if they exist there but not in DB
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('verification-documents')
        .list('', { limit: 1000 });

      console.log('🗄️ [TalentApproval] Storage files check:', {
        filesCount: storageFiles?.length || 0,
        error: storageError,
        files: storageFiles?.map(f => ({ name: f.name }))
      });

      // Create comprehensive document mapping from verification_documents table - focus on valid base64 data
      const userDocuments = new Map();
      if (verificationDocs && verificationDocs.length > 0) {
        verificationDocs.forEach(doc => {
          const userId = doc.user_id;
          if (userId) {
            if (!userDocuments.has(userId)) {
              userDocuments.set(userId, {
                id_card: false,
                profile_photo: false,
                files: [],
                documents: []
              });
            }

            const userDocs = userDocuments.get(userId);

            // Only count documents with valid base64 data
            const hasValidBase64 = doc.document_url && doc.document_url.startsWith('data:image/');

            if (doc.document_type === 'id_card' && hasValidBase64) {
              userDocs.id_card = true;
              console.log('🆔 [TalentApproval] Valid ID Card found for user:', userId.slice(0, 8));
            }

            if (doc.document_type === 'profile_photo' && hasValidBase64) {
              userDocs.profile_photo = true;
              console.log('📸 [TalentApproval] Valid Profile photo found for user:', userId.slice(0, 8));
            }
            
            userDocs.files.push(doc.document_url);
            userDocs.documents.push(doc);
          }
        });
      }

      // Transform users to comprehensive talent registration data
      const transformedTalents: TalentRegistrationData[] = companionUsers.map(user => {
        let profileData = null;
        let rawUserMetadata = user.raw_user_meta_data || {};
        
        // Parse profile_data if exists
        if (user.profile_data) {
          try {
            profileData = JSON.parse(user.profile_data);
            console.log('📝 [TalentApproval] Parsed profile data for:', user.id.slice(0, 8), profileData);
          } catch (error) {
            console.warn('⚠️ [TalentApproval] Failed to parse profile_data for user:', user.id, error);
          }
        }

        // Enhanced document status - check multiple ID patterns and partial matches
        const checkDocumentStatus = (userId: string) => {
          const fullId = userDocuments.get(userId);
          const shortId = userDocuments.get(userId.slice(0, 8));
          const mediumId = userDocuments.get(userId.slice(0, 12));
          const uuidId = userDocuments.get(userId.slice(0, 36));
          
          return fullId || shortId || mediumId || uuidId || { id_card: false, profile_photo: false, files: [] };
        };

        const userDocs = checkDocumentStatus(user.id);
        
        // More comprehensive service and availability mapping
        const getServices = () => {
          if (profileData?.services && Array.isArray(profileData.services)) return profileData.services;
          if (profileData?.selectedServices && Array.isArray(profileData.selectedServices)) return profileData.selectedServices;
          if (rawUserMetadata.services && Array.isArray(rawUserMetadata.services)) return rawUserMetadata.services;
          if (rawUserMetadata.selected_services && Array.isArray(rawUserMetadata.selected_services)) return rawUserMetadata.selected_services;
          return [];
        };

        const getAvailability = () => {
          if (profileData?.availability && Array.isArray(profileData.availability)) return profileData.availability;
          if (profileData?.dateActivities && Array.isArray(profileData.dateActivities)) return profileData.dateActivities;
          if (rawUserMetadata.availability && Array.isArray(rawUserMetadata.availability)) return rawUserMetadata.availability;
          if (rawUserMetadata.date_activities && Array.isArray(rawUserMetadata.date_activities)) return rawUserMetadata.date_activities;
          return [];
        };

        const talent: TalentRegistrationData = {
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || user.name || rawUserMetadata.full_name || 'Tidak ada nama',
          phone: user.phone || rawUserMetadata.phone || '',
          age: profileData?.age || user.age || rawUserMetadata.age || 0,
          location: profileData?.location || user.location || rawUserMetadata.location || 'Tidak diisi',
          bio: profileData?.bio || user.bio || rawUserMetadata.bio || '',
          hourly_rate: profileData?.hourlyRate || user.hourly_rate || rawUserMetadata.hourly_rate || 0,
          services: getServices(),
          languages: profileData?.languages || rawUserMetadata.languages || ['Bahasa Indonesia'],
          interests: profileData?.interests || rawUserMetadata.interests || [],
          experience_years: profileData?.experienceYears || rawUserMetadata.experience_years || 0,
          transportation_mode: profileData?.transportationMode || rawUserMetadata.transportation_mode || '',
          emergency_contact: profileData?.emergencyContact || rawUserMetadata.emergency_contact || '',
          emergency_phone: profileData?.emergencyPhone || rawUserMetadata.emergency_phone || '',
          availability: getAvailability(),
           // Enhanced document detection with metadata fallback
           has_id_card: !!(
             userDocs?.id_card || 
             profileData?.hasIdCard || 
             profileData?.idCardUrl || 
             rawUserMetadata.has_id_card ||
             rawUserMetadata.hasIdCard ||  // Use metadata from registration
             userDocs?.files?.some((file: string) => file.toLowerCase().includes('id') || file.toLowerCase().includes('ktp'))
           ),
           has_profile_photo: !!(
             userDocs?.profile_photo || 
             profileData?.hasProfilePhoto || 
             profileData?.profilePhotoUrl || 
             user.profile_image ||
             rawUserMetadata.has_profile_photo ||
             rawUserMetadata.hasProfilePhoto ||  // Use metadata from registration
             userDocs?.files?.some((file: string) => file.toLowerCase().includes('profile') || file.toLowerCase().includes('photo'))
           ),
          id_card_url: profileData?.idCardUrl,
          profile_photo_url: profileData?.profilePhotoUrl || user.profile_image,
          created_at: user.created_at,
          verification_status: user.verification_status as 'pending' | 'verified' | 'rejected',
          specialties: getServices(),
          // Additional comprehensive fields
          city: user.city || rawUserMetadata.city || profileData?.city,
          zodiac: user.zodiac || rawUserMetadata.zodiac || profileData?.zodiac,
          love_language: user.love_language || rawUserMetadata.love_language || profileData?.loveLanguage,
          party_buddy_eligible: user.party_buddy_eligible || rawUserMetadata.party_buddy_eligible || profileData?.partyBuddyEligible || false,
          profile_image: user.profile_image,
          documents: userDocs,
          date_activities: getAvailability(),
          party_buddy_available: user.party_buddy_eligible || rawUserMetadata.party_buddy_eligible || profileData?.partyBuddyEligible || false,
          selected_services: getServices(),
          service_rates: profileData?.serviceRates || rawUserMetadata.service_rates || {},
          password_created: true,
          signup_completed: !!(profileData || Object.keys(rawUserMetadata).length > 2)
        };

        console.log('🔄 [TalentApproval] Transformed talent:', {
          id: talent.id.slice(0, 8),
          name: talent.full_name,
          verification_status: talent.verification_status,
          has_id_card: talent.has_id_card,
          has_profile_photo: talent.has_profile_photo,
          services: talent.services,
          documents: talent.documents,
          signup_completed: talent.signup_completed
        });

        return talent;
      });

      console.log('✅ [TalentApproval] Final transformed talents:', transformedTalents.length);
      
      // Show status breakdown (should not include rejected)
      const statusBreakdown = transformedTalents.reduce((acc: any, talent) => {
        acc[talent.verification_status] = (acc[talent.verification_status] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 [TalentApproval] Status breakdown (excluding rejected):', statusBreakdown);

      setTalents(transformedTalents);

    } catch (error: any) {
      console.error('❌ [TalentApproval] Error fetching talent registrations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pendaftaran talent: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    console.log('🔄 [TalentApproval] Setting up real-time updates...');
    
    const channel = supabase
      .channel('talent-registrations-approval')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'user_type=eq.companion'
        },
        (payload) => {
          console.log('🔄 [TalentApproval] Real-time update received:', payload);
          fetchTalentRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterTalents = () => {
    let filtered = talents;

    if (searchTerm) {
      filtered = filtered.filter(talent =>
        talent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(talent => talent.verification_status === statusFilter);
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(talent => 
        talent.services.some(service => 
          service.toLowerCase().includes(serviceFilter.toLowerCase())
        )
      );
    }

    console.log('🔍 [TalentApproval] Filtered talents:', filtered.length, 'from', talents.length);
    setFilteredTalents(filtered);
  };

  const handleApproval = async (talentId: string, approved: boolean, rejectionReason?: string) => {
    try {
      console.log(`${approved ? '✅' : '❌'} [TalentApproval] Processing approval for talent:`, talentId);
      
      if (approved) {
        // If approved, update status directly in database with comprehensive data
        const updateData = {
          user_type: 'companion' as const,
          verification_status: 'verified' as const,
          status: 'active' as const,
          is_available: true,
          updated_at: new Date().toISOString(),
          // Ensure basic fields for Browse Talents display
          name: talent.full_name || talent.name || 'Unknown Talent',
          age: talent.age || 25,
          location: talent.location || talent.city || 'Jakarta',
          bio: talent.bio || 'Professional companion available for various services.',
          profile_image: talent.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
          average_rating: talent.average_rating || 4.5,
          total_orders: talent.total_orders || 0,
          featured_talent: false,
          is_newcomer: true
        };

        const { error: directError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', talentId);

        if (directError) {
          console.error('❌ [TalentApproval] Direct database update failed:', directError);
          throw directError;
        }

        console.log('✅ [TalentApproval] Talent approved successfully with comprehensive data');
        
        // Update local state for approved talent
        setTalents(prev => 
          prev.map(talent => 
            talent.id === talentId 
              ? { ...talent, verification_status: 'verified' as any }
              : talent
          )
        );

        // Try to send notification (non-blocking)
        try {
          const { error: notificationError } = await supabase.functions.invoke('send-approval-notification', {
            body: { 
              userId: talentId, 
              approved: true,
              userType: 'talent'
            }
          });
          
          if (notificationError) {
            console.warn('[TalentApproval] Notification failed:', notificationError);
          }
        } catch (notificationError) {
          console.warn('[TalentApproval] Notification error:', notificationError);
        }

      } else {
        // If rejected, completely delete all data using edge function
        console.log('🗑️ [TalentApproval] Completely deleting rejected talent data...');
        
        try {
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: talentId }
          });

          if (deleteError) {
            console.error('❌ [TalentApproval] Edge function error:', deleteError);
            
            // Fallback: Try direct database deletion
            console.log('🔄 [TalentApproval] Attempting fallback deletion...');
            
            // Delete from profiles table directly
            const { error: profileDeleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', talentId);

            if (profileDeleteError) {
              console.error('❌ [TalentApproval] Fallback profile deletion failed:', profileDeleteError);
              throw new Error('Failed to delete talent data: ' + profileDeleteError.message);
            }
            
            console.log('✅ [TalentApproval] Fallback deletion completed');
          } else {
            console.log('✅ [TalentApproval] Edge function deletion completed:', deleteResult);
          }

          // **PERBAIKAN UTAMA: Hapus talent dari state local segera setelah berhasil dihapus**
          console.log('🔄 [TalentApproval] Removing talent from local state...');
          setTalents(prev => {
            const filtered = prev.filter(talent => talent.id !== talentId);
            console.log('📊 [TalentApproval] Updated local state:', {
              before: prev.length,
              after: filtered.length,
              removedId: talentId.slice(0, 8)
            });
            return filtered;
          });

        } catch (deleteError) {
          console.error('❌ [TalentApproval] Complete deletion failed:', deleteError);
          throw deleteError;
        }
      }
      
      toast({
        title: approved ? "✅ Talent Disetujui" : "🗑️ Talent Ditolak & Dihapus",
        description: approved 
          ? `Pendaftaran talent telah disetujui dan diaktifkan.`
          : `Talent ditolak dan data telah dihapus dari sistem.`,
        className: approved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      });

      // **PERBAIKAN: Kurangi waktu tunggu untuk refresh data**
      if (approved) {
        // Hanya refresh jika approved (karena rejected sudah langsung update state)
        setTimeout(() => fetchTalentRegistrations(), 1000);
      }
      
    } catch (error: any) {
      console.error('❌ [TalentApproval] Error processing talent:', error);
      toast({
        title: "Error",
        description: "Gagal memproses talent: " + (error.message || 'Unknown error'),
        variant: "destructive"
      });
    }
  };

  // Standalone delete function for any talent
  const handleDeleteTalent = async (talentId: string, talentName: string) => {
    try {
      console.log('🗑️ [TalentApproval] Deleting talent:', talentId);

      // Use the admin-delete-user edge function for complete cleanup
      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: talentId }
      });

      if (deleteError) {
        console.error('❌ [TalentApproval] Edge function error:', deleteError);

        // Fallback: Try direct database deletion
        console.log('🔄 [TalentApproval] Attempting fallback deletion...');

        // Delete from profiles table directly
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', talentId);

        if (profileDeleteError) {
          console.error('❌ [TalentApproval] Fallback profile deletion failed:', profileDeleteError);
          throw new Error('Failed to delete talent data: ' + profileDeleteError.message);
        }

        console.log('✅ [TalentApproval] Fallback deletion completed');
      } else {
        console.log('✅ [TalentApproval] Edge function deletion completed:', deleteResult);
      }

      // Remove from local state immediately
      setTalents(prev => prev.filter(talent => talent.id !== talentId));

      toast({
        title: "🗑️ Talent Dihapus",
        description: `${talentName} dan semua data terkait telah dihapus dari sistem.`,
        className: "bg-red-50 border-red-200"
      });

      // Refresh data to ensure consistency
      setTimeout(() => fetchTalentRegistrations(), 1000);

    } catch (error: any) {
      console.error('❌ Error deleting talent:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus talent: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Get unique services for filter
  const uniqueServices = Array.from(new Set(
    talents.flatMap(talent => talent.services)
  )).filter(Boolean);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Memuat data pendaftaran talent...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = talents.filter(t => t.verification_status === 'pending').length;
  const approvedCount = talents.filter(t => t.verification_status === 'verified').length;
  const rejectedCount = talents.filter(t => t.verification_status === 'rejected').length;
  const incompleteDataCount = talents.filter(t => !t.services?.length || !t.has_id_card || !t.has_profile_photo).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendaftaran</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{talents.length}</div>
            <p className="text-xs text-muted-foreground">Total talent terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Perlu persetujuan admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Talent yang disetujui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Talent yang ditolak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Incomplete</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{incompleteDataCount}</div>
            <p className="text-xs text-muted-foreground">Data tidak lengkap</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Pencarian Data Talent
            </CardTitle>
            <Button
              onClick={fetchTalentRegistrations}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan nama, email, lokasi, atau layanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">⏳ Menunggu Review</SelectItem>
                  <SelectItem value="verified">✅ Disetujui</SelectItem>
                  <SelectItem value="rejected">❌ Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Layanan</SelectItem>
                  {uniqueServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredTalents.length} dari {talents.length} total talent
            </p>
            <Button 
              variant="outline" 
              onClick={fetchTalentRegistrations}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Talent Cards */}
      <div className="space-y-4">
        {filteredTalents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {loading ? "Memuat data..." : "Tidak Ada Data"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all'
                  ? 'Tidak ada talent yang sesuai dengan filter yang dipilih.'
                  : 'Belum ada pendaftaran talent yang masuk.'}
              </p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Debug Info:</p>
                <p>Total talents found: {talents.length}</p>
                <p>Filtered result: {filteredTalents.length}</p>
                <p>Pending: {pendingCount}, Verified: {approvedCount}, Rejected: {rejectedCount}</p>
              </div>
              {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setServiceFilter('all');
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTalents.map((talent) => (
            <TalentApprovalCard
              key={talent.id}
              talent={talent}
              onApprove={(id) => handleApproval(id, true)}
              onReject={(id, reason) => handleApproval(id, false, reason)}
              onDelete={(id, name) => handleDeleteTalent(id, name)}
              showDeleteOption={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TalentApprovalSystem;

