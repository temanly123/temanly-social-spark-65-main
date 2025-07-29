
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Mail, Phone, User, FileText, Eye, EyeOff, Copy, Calendar, MapPin, RefreshCw, AlertCircle, Database, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { adminUserService, AdminUser } from '@/services/adminUserService';

interface TalentApplication {
  id: string;
  name: string;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  status: string;
  created_at: string;
  updated_at: string;
  id_card_url?: string;
  photo_url?: string;
  experience_years?: number;
  hourly_rate?: number;
  specialties?: string[];
  languages?: string[];
  user_type: string;
  profile_data?: string;
  auth_only: boolean;
  has_profile: boolean;
}

const TalentRegistrationManagement = () => {
  const [applications, setApplications] = useState<TalentApplication[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TalentApplication | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTalentApplications();
    setupRealTimeUpdates();
  }, []);

  const transformAdminUserToTalentApplication = (user: AdminUser): TalentApplication => {
    // Try to parse profile_data if it exists
    let profileData = null;
    if (user.profile_data) {
      try {
        profileData = JSON.parse(user.profile_data);
        console.log('📊 Parsed profile data for user:', user.id.slice(0, 8), profileData);
      } catch (error) {
        console.warn('⚠️ Failed to parse profile data for user:', user.id.slice(0, 8), error);
      }
    }

    return {
      id: user.id,
      name: user.name || user.full_name || 'No Name',
      full_name: user.full_name || user.name || '',
      email: user.email,
      phone: user.phone || '',
      // Get age from profile data or user directly
      age: profileData?.age || user.age || null,
      // Get location from profile data or user directly  
      location: profileData?.location || user.location || null,
      // Get bio from profile data or user directly
      bio: profileData?.bio || user.bio || null,
      verification_status: user.verification_status,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
      // Get hourly rate from profile data or user directly
      hourly_rate: profileData?.hourlyRate || user.hourly_rate || null,
      // Get experience from profile data
      experience_years: profileData?.experienceYears || 0,
      // Get languages from profile data
      languages: profileData?.languages || [],
      // Get specialties/services from profile data
      specialties: profileData?.services || [],
      // Document URLs from profile data
      id_card_url: profileData?.idCardUrl || null,
      photo_url: profileData?.profilePhotoUrl || null,
      user_type: user.user_type,
      profile_data: user.profile_data,
      auth_only: user.auth_only,
      has_profile: user.has_profile
    };
  };

  const fetchTalentApplications = async () => {
    try {
      console.log('🔍 Fetching talent applications...');
      setRefreshing(true);
      setConnectionStatus('Connecting to database...');
      
      // Get all users using the admin service which includes both Auth and Profile data
      const { users, error } = await adminUserService.getAllUsers();
      
      if (error) {
        throw new Error(error);
      }

      console.log('📊 All users data:', users);
      
      // Filter for talent users (companions) - including both auth-only and profile users
      const talentUsers = users.filter((user: AdminUser) => 
        user.user_type === 'companion'
      );
      
      console.log(`✅ Total users fetched: ${users.length}`);
      console.log(`✅ Talent users found: ${talentUsers.length}`);
      console.log('📋 Talent users details:', talentUsers);
      
      // Transform the data to match our interface
      const transformedTalents = talentUsers.map(transformAdminUserToTalentApplication);
      
      console.log('🎯 Transformed talents:', transformedTalents);
      
      setAllUsers(users);
      setApplications(transformedTalents);
      setConnectionStatus(`Successfully loaded ${users.length} total users, ${transformedTalents.length} talents`);

    } catch (error: any) {
      console.error('❌ Error fetching talent applications:', error);
      setConnectionStatus(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: "Gagal memuat data pendaftaran talent. Coba lagi atau periksa koneksi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const channel = supabase
      .channel('talent-applications-admin')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'user_type=eq.companion'
        },
        (payload) => {
          console.log('🔄 Real-time update received for talent profiles:', payload);
          fetchTalentApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApproval = async (applicationId: string, approved: boolean) => {
    try {
      console.log(`${approved ? '✅' : '❌'} Processing approval for talent:`, applicationId);

      if (approved) {
        // If approved, update status normally
        const verificationStatus = 'verified';
        const profileStatus = 'active';

        // First, check if user has a profile
        const userToUpdate = applications.find(app => app.id === applicationId);

        if (!userToUpdate) {
          throw new Error('User not found');
        }

        if (userToUpdate.auth_only && !userToUpdate.has_profile) {
          // User is auth-only, need to create profile first
          const adminUser = allUsers.find(u => u.id === applicationId);
          if (adminUser) {
            await adminUserService.createMissingProfiles([adminUser]);
            console.log('✅ Created profile for auth-only user');
          }
        }

        // Now update the profile with comprehensive data for Browse Talents
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', applicationId)
          .single();

        const updateData = {
          user_type: 'companion' as const,
          verification_status: verificationStatus,
          status: profileStatus,
          is_available: true,
          updated_at: new Date().toISOString(),
          // Ensure all required fields for Browse Talents
          name: currentProfile?.name || currentProfile?.full_name || 'Unknown Talent',
          age: currentProfile?.age || 25,
          location: currentProfile?.location || currentProfile?.city || 'Jakarta',
          bio: currentProfile?.bio || 'Professional companion available for various services.',
          profile_image: currentProfile?.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
          average_rating: currentProfile?.average_rating || 4.5,
          total_orders: currentProfile?.total_orders || 0,
          featured_talent: false,
          is_newcomer: true
        };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', applicationId);

        if (error) {
          console.error('❌ Error updating talent status:', error);
          throw error;
        }

        // Create auth user with the stored password
        try {
          console.log('🔐 Creating auth user for approved talent...');

          // Get the stored password for this talent
          const storedPassword = localStorage.getItem(`talent_password_${applicationId}`);
          const talentPassword = storedPassword || `Talent${Math.random().toString(36).slice(2, 8)}!`;

          // If no password was stored, store the generated one
          if (!storedPassword) {
            localStorage.setItem(`talent_password_${applicationId}`, talentPassword);
          }

          // Check if auth user already exists
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users?.find(u => u.email === userToUpdate.email);

          if (!existingUser) {
            // Create new auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: userToUpdate.email,
              password: talentPassword,
              email_confirm: true,
              user_metadata: {
                name: userToUpdate.name || userToUpdate.full_name,
                user_type: 'companion',
                phone: userToUpdate.phone
              }
            });

            if (authError) {
              console.error('❌ Error creating auth user:', authError);
              // Don't fail the approval if auth creation fails
              console.log('⚠️ Continuing with approval despite auth creation failure');
            } else {
              console.log('✅ Auth user created successfully for talent');
            }
          } else {
            // Update existing auth user password
            console.log('🔄 Updating password for existing auth user');
            await supabase.auth.admin.updateUserById(existingUser.id, {
              password: talentPassword
            });
            console.log('✅ Password updated for existing auth user');
          }
        } catch (authError) {
          console.error('❌ Auth user management failed:', authError);
          // Don't fail the approval process
          console.log('⚠️ Continuing with approval despite auth management failure');
        }

      } else {
        // If rejected, completely delete all data using edge function (same as other approval systems)
        console.log('🗑️ [TalentRegistrationManagement] Completely deleting rejected talent data...');

        try {
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: applicationId }
          });

          if (deleteError) {
            console.error('❌ [TalentRegistrationManagement] Edge function error:', deleteError);

            // Fallback: Try direct database deletion
            console.log('🔄 [TalentRegistrationManagement] Attempting fallback deletion...');

            // Delete from profiles table directly
            const { error: profileDeleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', applicationId);

            if (profileDeleteError) {
              console.error('❌ [TalentRegistrationManagement] Fallback profile deletion failed:', profileDeleteError);
              throw new Error('Failed to delete talent data: ' + profileDeleteError.message);
            }

            console.log('✅ [TalentRegistrationManagement] Fallback deletion completed');
          } else {
            console.log('✅ [TalentRegistrationManagement] Edge function deletion completed:', deleteResult);
          }

          // Remove from local state immediately for rejected users
          setApplications(prev => prev.filter(app => app.id !== applicationId));

        } catch (deleteError) {
          console.error('❌ [TalentRegistrationManagement] Complete deletion failed:', deleteError);
          throw deleteError;
        }
      }

      // Send notification (only for approved users, rejected users are deleted)
      if (approved) {
        await sendApprovalNotification(applicationId, approved);

        // Update local state for approved users
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, verification_status: 'verified' as any, status: 'active', auth_only: false, has_profile: true }
              : app
          )
        );

        // Refresh data to get latest
        setTimeout(() => fetchTalentApplications(), 1000);
      }

      toast({
        title: approved ? "✅ Talent Disetujui" : "🗑️ Talent Ditolak & Dihapus",
        description: approved
          ? `Pendaftaran talent telah disetujui dan notifikasi telah dikirim.`
          : `Talent ditolak dan semua data telah dihapus dari sistem. User dapat mendaftar ulang dengan email yang sama.`,
        className: approved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      });
      
    } catch (error: any) {
      console.error('❌ Error updating talent status:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status talent: " + error.message,
        variant: "destructive"
      });
    }
  };

  const sendApprovalNotification = async (applicationId: string, approved: boolean) => {
    try {
      console.log('📧 Sending approval notification...');
      const { error } = await supabase.functions.invoke('send-approval-notification', {
        body: { userId: applicationId, approved }
      });

      if (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
      }

      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      // Don't throw error here as the main approval still succeeded
    }
  };

  // Standalone delete function for any talent application
  const handleDeleteTalent = async (applicationId: string, applicationName: string) => {
    try {
      console.log('🗑️ [TalentRegistrationManagement] Deleting talent application:', applicationId);

      // Use the admin-delete-user edge function for complete cleanup
      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: applicationId }
      });

      if (deleteError) {
        console.error('❌ [TalentRegistrationManagement] Edge function error:', deleteError);

        // Fallback: Try direct database deletion
        console.log('🔄 [TalentRegistrationManagement] Attempting fallback deletion...');

        // Delete from profiles table directly
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', applicationId);

        if (profileDeleteError) {
          console.error('❌ [TalentRegistrationManagement] Fallback profile deletion failed:', profileDeleteError);
          throw new Error('Failed to delete talent data: ' + profileDeleteError.message);
        }

        console.log('✅ [TalentRegistrationManagement] Fallback deletion completed');
      } else {
        console.log('✅ [TalentRegistrationManagement] Edge function deletion completed:', deleteResult);
      }

      // Remove from local state immediately
      setApplications(prev => prev.filter(app => app.id !== applicationId));

      toast({
        title: "🗑️ Talent Dihapus",
        description: `${applicationName} dan semua data terkait telah dihapus dari sistem.`,
        className: "bg-red-50 border-red-200"
      });

      // Refresh data to ensure consistency
      setTimeout(() => fetchTalentApplications(), 1000);

    } catch (error: any) {
      console.error('❌ Error deleting talent:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus talent: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, verificationStatus: string) => {
    if (verificationStatus === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ Menunggu Review</Badge>;
    }
    if (verificationStatus === 'verified') {
      return <Badge className="bg-green-100 text-green-800 border-green-300">✅ Disetujui</Badge>;
    }
    if (verificationStatus === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">❌ Ditolak</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600">❓ Unknown</Badge>;
  };

  const parseProfileData = (profileData: string | null) => {
    if (!profileData) return null;
    try {
      return JSON.parse(profileData);
    } catch (error) {
      console.warn('⚠️ Failed to parse profile data:', error);
      return null;
    }
  };

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

  const pendingApplications = applications.filter(app => app.verification_status === 'pending');
  const approvedApplications = applications.filter(app => app.verification_status === 'verified');
  const rejectedApplications = applications.filter(app => app.verification_status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendaftaran</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
            <p className="text-xs text-muted-foreground">Semua pendaftaran talent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</div>
            <p className="text-xs text-muted-foreground">Perlu persetujuan admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedApplications.length}</div>
            <p className="text-xs text-muted-foreground">Talent yang disetujui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedApplications.length}</div>
            <p className="text-xs text-muted-foreground">Talent yang ditolak</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Status:</strong> {connectionStatus}</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleString('id-ID')}</p>
            
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchTalentApplications}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pendaftaran Talent ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Belum ada pendaftaran talent yang ditemukan.</p>
              <div className="mt-4 text-sm space-y-2">
                <p>Sistem telah terhubung dengan database.</p>
                <p>Total users di sistem: {allUsers.length}</p>
                <p>User type 'companion' yang ditemukan: {applications.length}</p>
              </div>
              <Button 
                onClick={fetchTalentApplications} 
                className="mt-4" 
                variant="outline"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Cek Lagi
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Talent</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Lokasi & Usia</TableHead>
                  <TableHead>Services & Tarif</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => {
                  const profileData = parseProfileData(application.profile_data);
                  
                  return (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{application.name || application.full_name || 'No Name'}</div>
                            <div className="text-sm text-gray-500">ID: {application.id.slice(0, 8)}...</div>
                            <div className="flex gap-1 mt-1">
                              {application.auth_only && (
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-600">Auth Only</Badge>
                              )}
                              {(profileData?.hasIdCard || application.id_card_url) && (
                                <Badge variant="outline" className="text-xs">📄 KTP</Badge>
                              )}
                              {(profileData?.hasProfilePhoto || application.photo_url) && (
                                <Badge variant="outline" className="text-xs">📸 Foto</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {application.email}
                          </div>
                          {application.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {application.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {application.location && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3" />
                              {application.location}
                            </div>
                          )}
                          {application.age && (
                            <div className="text-sm">
                              Usia: {application.age} tahun
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {application.hourly_rate && (
                            <div className="text-sm font-medium">
                              Rp {application.hourly_rate.toLocaleString()}/jam
                            </div>
                          )}
                          {application.specialties && application.specialties.length > 0 && (
                            <div className="text-xs">
                              {application.specialties.slice(0, 2).join(', ')}
                              {application.specialties.length > 2 && ` +${application.specialties.length - 2} lainnya`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(application.status, application.verification_status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {new Date(application.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  console.log('🔍 Opening detail modal for:', application.id);
                                  setSelectedApplication(application);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                                Detail
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detail Pendaftaran Talent Lengkap</DialogTitle>
                              </DialogHeader>
                              {selectedApplication && (
                                <TalentDetailView 
                                  application={selectedApplication}
                                  onApproval={handleApproval}
                                />
                              )}
                            </DialogContent>
                          </Dialog>

                          {application.verification_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => handleApproval(application.id, true)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApproval(application.id, false)}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Tolak
                              </Button>
                            </>
                          )}

                          {/* Delete button available for all applications */}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              const confirmMessage = `⚠️ PERINGATAN: Anda akan menghapus PERMANEN talent ini!\n\nNama: ${application.full_name || application.name}\nEmail: ${application.email}\nStatus: ${application.verification_status}\n\nSemua data termasuk:\n- Profil talent\n- Dokumen verifikasi\n- Riwayat booking\n- Data transaksi\n- Review dan rating\n\nAksi ini TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin ingin melanjutkan?`;

                              if (window.confirm(confirmMessage)) {
                                handleDeleteTalent(application.id, application.full_name || application.name);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Separate component for talent detail view
const TalentDetailView = ({
  application,
  onApproval
}: {
  application: TalentApplication;
  onApproval: (id: string, approved: boolean) => void;
}) => {
  const { toast } = useToast();
  const profileData = application.profile_data ? JSON.parse(application.profile_data) : null;
  const [talentPassword, setTalentPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Function to generate or retrieve talent password
  const generateTalentPassword = () => {
    // Generate a secure password for the talent
    const password = `Talent${Math.random().toString(36).slice(2, 8)}!`;
    setTalentPassword(password);
    return password;
  };

  // Function to get or create talent password
  const getTalentPassword = async () => {
    setLoadingPassword(true);
    try {
      // Check if password is already stored in localStorage for this talent
      const storedPassword = localStorage.getItem(`talent_password_${application.id}`);

      if (storedPassword) {
        setTalentPassword(storedPassword);
      } else {
        // Generate new password and store it
        const newPassword = generateTalentPassword();
        localStorage.setItem(`talent_password_${application.id}`, newPassword);

        // Also try to update the auth user if they exist
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const existingUser = authUsers.users?.find(u => u.email === application.email);

          if (existingUser) {
            console.log('🔄 Updating password for existing auth user:', application.email);
            await supabase.auth.admin.updateUserById(existingUser.id, {
              password: newPassword
            });
            console.log('✅ Password updated for auth user');
          }
        } catch (error) {
          console.log('⚠️ Could not update auth user password:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error managing talent password:', error);
      // Fallback to generated password
      generateTalentPassword();
    } finally {
      setLoadingPassword(false);
    }
  };

  useEffect(() => {
    // Auto-load password when component mounts
    getTalentPassword();
  }, [application.id]);

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-gray-900">📋 Informasi Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
            <p className="text-sm mt-1">{application.name || application.full_name || 'Tidak ada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm mt-1">{application.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nomor WhatsApp</label>
            <p className="text-sm mt-1">{application.phone || 'Tidak ada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Usia</label>
            <p className="text-sm mt-1">{application.age ? `${application.age} tahun` : 'Tidak ada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Lokasi</label>
            <p className="text-sm mt-1">{application.location || 'Tidak ada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tanggal Daftar</label>
            <p className="text-sm mt-1">{new Date(application.created_at).toLocaleString('id-ID')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status Data</label>
            <p className="text-sm mt-1">
              {application.auth_only ? (
                <Badge className="bg-orange-100 text-orange-700">Auth Only - Belum ada Profile</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700">Profile Lengkap</Badge>
              )}
            </p>
          </div>
        </div>
        
        {application.bio && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
            <p className="text-sm bg-white p-3 rounded border">{application.bio}</p>
          </div>
        )}
      </div>

      {/* Login Credentials */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-green-900">🔐 Kredensial Login Talent</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-green-700">Email Login</label>
            <p className="text-sm mt-1 font-mono bg-white px-2 py-1 rounded border">
              {application.email}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-green-700">Password Login</label>
            <div className="flex items-center gap-2 mt-1">
              {loadingPassword ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                  <span className="text-xs text-gray-500">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border flex-1">
                    {showPassword ? talentPassword : '••••••••••••'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 px-2 text-xs"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(talentPassword);
                      toast({
                        title: "Password Copied!",
                        description: "Password telah disalin ke clipboard",
                        className: "bg-green-50 border-green-200"
                      });
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPassword = generateTalentPassword();
                      localStorage.setItem(`talent_password_${application.id}`, newPassword);
                      toast({
                        title: "Password Updated!",
                        description: "Password baru telah dibuat untuk talent",
                        className: "bg-blue-50 border-blue-200"
                      });
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-green-600 mt-1">
              ✅ Gunakan kredensial ini untuk login talent ke dashboard
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-2">📋 Instruksi untuk Talent:</h4>
          <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
            <li>Buka halaman login: <code className="bg-green-100 px-1 rounded">localhost:3000/login</code></li>
            <li>Masukkan email: <code className="bg-green-100 px-1 rounded">{application.email}</code></li>
            <li>Masukkan password yang tertera di atas</li>
            <li>Klik "Masuk" untuk mengakses dashboard talent</li>
          </ol>
        </div>
      </div>

      {/* Service Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-blue-900">💼 Informasi Layanan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-blue-700">Tarif per Jam</label>
            <p className="text-sm mt-1 font-medium">
              {application.hourly_rate ? `Rp ${application.hourly_rate.toLocaleString()}` : 'Belum diisi'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700">Pengalaman</label>
            <p className="text-sm mt-1">
              {application.experience_years ? `${application.experience_years} tahun` : 'Belum diisi'}
            </p>
          </div>
        </div>
        
        {application.specialties && application.specialties.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-blue-700 block mb-2">Services yang Ditawarkan</label>
            <div className="flex flex-wrap gap-1">
              {application.specialties.map((service: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {application.languages && application.languages.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-blue-700 block mb-2">Bahasa yang Dikuasai</label>
            <div className="flex flex-wrap gap-1">
              {application.languages.map((language: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Status */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-yellow-900">📄 Status Dokumen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-yellow-700">Foto KTP</label>
            <p className="text-sm mt-1">
              {(profileData?.hasIdCard || application.id_card_url) ? 
                <Badge className="bg-green-100 text-green-700">✅ Sudah Upload</Badge> : 
                <Badge className="bg-red-100 text-red-700">❌ Belum Upload</Badge>
              }
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-yellow-700">Foto Profil</label>
            <p className="text-sm mt-1">
              {(profileData?.hasProfilePhoto || application.photo_url) ? 
                <Badge className="bg-green-100 text-green-700">✅ Sudah Upload</Badge> : 
                <Badge className="bg-red-100 text-red-700">❌ Belum Upload</Badge>
              }
            </p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {profileData && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 text-purple-900">📝 Informasi Tambahan</h3>
          <div className="grid grid-cols-2 gap-4">
            {profileData.transportationMode && (
              <div>
                <label className="text-sm font-medium text-purple-700">Mode Transportasi</label>
                <p className="text-sm mt-1">{profileData.transportationMode}</p>
              </div>
            )}
            {profileData.emergencyContact && (
              <div>
                <label className="text-sm font-medium text-purple-700">Kontak Darurat</label>
                <p className="text-sm mt-1">{profileData.emergencyContact}</p>
              </div>
            )}
            {profileData.emergencyPhone && (
              <div>
                <label className="text-sm font-medium text-purple-700">Nomor Darurat</label>
                <p className="text-sm mt-1">{profileData.emergencyPhone}</p>
              </div>
            )}
            {profileData.availability && profileData.availability.length > 0 && (
              <div>
                <label className="text-sm font-medium text-purple-700">Ketersediaan</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profileData.availability.map((avail: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {avail}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {application.verification_status === 'pending' && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => onApproval(application.id, true)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            ✅ Setujui Talent
          </Button>
          <Button
            variant="destructive"
            onClick={() => onApproval(application.id, false)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            ❌ Tolak Talent
          </Button>
        </div>
      )}

      {application.verification_status === 'verified' && (
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <p className="text-green-800 font-medium">✅ Talent ini sudah disetujui</p>
        </div>
      )}

      {application.verification_status === 'rejected' && (
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <p className="text-red-800 font-medium">❌ Talent ini sudah ditolak</p>
        </div>
      )}
    </div>
  );
};

export default TalentRegistrationManagement;
