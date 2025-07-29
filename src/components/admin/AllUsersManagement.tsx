
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, Filter, RefreshCw, Eye, Mail, Phone, MapPin, Calendar, User, Star, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { adminUserService, AdminUser } from '@/services/adminUserService';

const AllUsersManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllUsers();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, userTypeFilter, statusFilter]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 [AllUsersManagement] Fetching all users...');

      const { users: allUsers, error } = await adminUserService.getAllUsers();

      console.log('📊 [AllUsersManagement] Service response:', {
        usersCount: allUsers?.length || 0,
        error: error,
        hasUsers: !!allUsers && allUsers.length > 0
      });

      if (error) {
        console.error('❌ [AllUsersManagement] Service returned error:', error);
        // Don't throw error for empty data, just handle gracefully
        setUsers([]);
        return;
      }

      const safeUsers = allUsers || [];
      console.log('✅ [AllUsersManagement] Fetched all users:', safeUsers.length);

      // Log first few users for debugging
      if (safeUsers.length > 0) {
        console.log('👥 [AllUsersManagement] Sample users:', safeUsers.slice(0, 3).map(u => ({
          id: u.id.slice(0, 8),
          name: u.name,
          email: u.email,
          user_type: u.user_type,
          verification_status: u.verification_status
        })));
      }

      setUsers(safeUsers);

    } catch (error: any) {
      console.error('❌ [AllUsersManagement] Error fetching users:', error);
      // Don't show error toast for empty data, just set empty state
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const channel = supabase
      .channel('all-users')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles'
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          fetchAllUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by user type
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.user_type === userTypeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'auth_only') {
        filtered = filtered.filter(user => user.auth_only);
      } else {
        filtered = filtered.filter(user => user.verification_status === statusFilter);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = new Set(filteredUsers.map(user => user.id));
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.size === 0) return;

    try {
      setIsDeleting(true);
      console.log('🗑️ [AllUsersManagement] Deleting selected users:', Array.from(selectedUsers));

      let successCount = 0;
      let errorCount = 0;

      // Delete users one by one using the comprehensive admin-delete-user function
      for (const userId of Array.from(selectedUsers)) {
        try {
          console.log(`🗑️ [AllUsersManagement] Deleting user: ${userId}`);

          // Use the admin-delete-user edge function for complete cleanup
          console.log(`🔧 [AllUsersManagement] Calling admin-delete-user function for ${userId}...`);
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: userId }
          });

          console.log(`📋 [AllUsersManagement] Function response for ${userId}:`, {
            deleteError,
            deleteResult,
            success: deleteResult?.success
          });

          if (deleteError) {
            console.error(`❌ [AllUsersManagement] Edge function failed for ${userId}:`, deleteError);
            errorCount++;
            continue;
          }

          if (!deleteResult?.success) {
            console.error(`❌ [AllUsersManagement] Delete operation failed for ${userId}:`, deleteResult?.error);
            errorCount++;
            continue;
          }

          successCount++;
          console.log(`✅ [AllUsersManagement] Successfully deleted user: ${userId}`, deleteResult?.details);

        } catch (error) {
          console.error(`❌ [AllUsersManagement] Error deleting user ${userId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "✅ Users Deleted",
          description: `Successfully deleted ${successCount} user(s) and all associated data.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
          className: "bg-green-50 border-green-200"
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "❌ Delete Failed",
          description: `Failed to delete ${errorCount} user(s). Please try again.`,
          variant: "destructive"
        });
      }

      // Clear selection and refresh
      setSelectedUsers(new Set());
      await fetchAllUsers();

    } catch (error: any) {
      console.error('❌ [AllUsersManagement] Error in delete operation:', error);
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred during deletion.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'companion':
        return <Badge className="bg-purple-100 text-purple-800">Talent</Badge>;
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'user':
      default:
        return <Badge className="bg-blue-100 text-blue-800">User</Badge>;
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (user.auth_only) {
      return <Badge className="bg-orange-100 text-orange-800">Auth Only</Badge>;
    }
    
    switch (user.verification_status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">✅ Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Memuat data semua user...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUsers = users.length;
  const regularUsers = users.filter(u => u.user_type === 'user').length;
  const talents = users.filter(u => u.user_type === 'companion').length;
  const authOnlyUsers = users.filter(u => u.auth_only).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Semua user terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Reguler</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{regularUsers}</div>
            <p className="text-xs text-muted-foreground">User biasa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{talents}</div>
            <p className="text-xs text-muted-foreground">Companion/Talent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Only</CardTitle>
            <Filter className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{authOnlyUsers}</div>
            <p className="text-xs text-muted-foreground">Belum ada profile</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan nama, email, atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipe User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="user">User Reguler</SelectItem>
                  <SelectItem value="companion">Talent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="auth_only">Auth Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={fetchAllUsers}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            {selectedUsers.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedUsers.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Confirm User Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedUsers.size} selected user(s)?
                      This action cannot be undone and will permanently remove:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>User accounts and authentication</li>
                        <li>Profile information</li>
                        <li>All associated data</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteSelectedUsers}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Users'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Semua User ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>
                {searchTerm || userTypeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Tidak ada user yang sesuai dengan filter.'
                  : 'Belum ada user terdaftar.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <TableHead>User Info</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail Talent</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        aria-label={`Select user ${user.name || user.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3" />
                            {user.location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getUserTypeBadge(user.user_type)}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    
                    <TableCell>
                      {user.user_type === 'companion' ? (
                        <div className="space-y-1">
                          {user.hourly_rate && (
                            <div className="text-sm">Rp {user.hourly_rate.toLocaleString()}/jam</div>
                          )}
                          {user.rating && (
                            <div className="text-sm">⭐ {user.rating}</div>
                          )}
                          {user.total_bookings && (
                            <div className="text-sm">{user.total_bookings} booking</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetail(true);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail User Lengkap</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserDetailView user={selectedUser} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UserDetailView: React.FC<{ user: AdminUser }> = ({ user }) => {
  const parseProfileData = () => {
    if (!user.profile_data) return null;
    try {
      return JSON.parse(user.profile_data);
    } catch (error) {
      console.warn('Failed to parse profile data:', error);
      return null;
    }
  };

  const profileData = parseProfileData();

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-gray-900">👤 Informasi Dasar</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama</label>
            <p className="text-sm mt-1">{user.name || 'Tidak ada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nomor HP</label>
            <p className="text-sm mt-1">{user.phone || 'Tidak ada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tipe User</label>
            <p className="text-sm mt-1">{user.user_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status Verifikasi</label>
            <p className="text-sm mt-1">{user.verification_status}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status Akun</label>
            <p className="text-sm mt-1">{user.status}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tanggal Daftar</label>
            <p className="text-sm mt-1">{new Date(user.created_at).toLocaleString('id-ID')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Data Source</label>
            <p className="text-sm mt-1">
              {user.auth_only ? 'Auth Only' : 'Full Profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Talent Specific Information */}
      {user.user_type === 'companion' && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 text-purple-900">⭐ Informasi Talent</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-purple-700">Usia</label>
              <p className="text-sm mt-1">{user.age ? `${user.age} tahun` : 'Tidak diisi'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Lokasi</label>
              <p className="text-sm mt-1">{user.location || 'Tidak diisi'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Tarif per Jam</label>
              <p className="text-sm mt-1">
                {user.hourly_rate ? `Rp ${user.hourly_rate.toLocaleString()}` : 'Tidak diisi'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Rating</label>
              <p className="text-sm mt-1">
                {user.rating ? `⭐ ${user.rating}/5` : 'Belum ada rating'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Total Booking</label>
              <p className="text-sm mt-1">{user.total_bookings || 0} kali</p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Total Pendapatan</label>
              <p className="text-sm mt-1">
                {user.total_earnings ? `Rp ${user.total_earnings.toLocaleString()}` : 'Rp 0'}
              </p>
            </div>
          </div>

          {user.bio && (
            <div className="mt-4">
              <label className="text-sm font-medium text-purple-700 block mb-1">Bio</label>
              <p className="text-sm bg-white p-3 rounded border">{user.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Profile Data Details */}
      {profileData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 text-blue-900">📋 Data Profile Lengkap</h3>
          <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AllUsersManagement;
