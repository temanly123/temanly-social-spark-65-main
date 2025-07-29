import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, Search, Eye, UserCheck, UserX, Mail, Phone, Calendar, RefreshCw, AlertTriangle, Database, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database as DatabaseType } from '@/integrations/supabase/types';
import { adminUserService, AdminUser } from '@/services/adminUserService';
import { DemoDataService, DemoUser } from '@/services/demoDataService';
import UserDetailModal from './UserDetailModal';

type UserType = DatabaseType['public']['Enums']['user_type'];
type VerificationStatus = DatabaseType['public']['Enums']['verification_status'];

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | UserType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | VerificationStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTalents: 0,
    totalAdmins: 0,
    verifiedUsers: 0,
    pendingApprovals: 0,
    authOnlyUsers: 0
  });

  useEffect(() => {
    fetchUsers();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [users]);

  const fetchUsers = async () => {
    try {
      console.log('🔍 [UserManagement] Fetching users using AdminUserService...');
      setRefreshing(true);
      setConnectionStatus('Connecting to database and Auth...');

      const { users: fetchedUsers, error } = await adminUserService.getAllUsers();

      console.log('📊 [UserManagement] Service response:', {
        usersCount: fetchedUsers?.length || 0,
        error: error,
        hasUsers: !!fetchedUsers && fetchedUsers.length > 0
      });

      if (error) {
        console.error('❌ [UserManagement] Service returned error:', error);
        // Don't throw error for empty data, just log it
        setConnectionStatus(`Warning: ${error}`);
        setUsers([]); // Set empty array instead of throwing
        return;
      }

      // Handle case where fetchedUsers might be null or undefined
      const safeUsers = fetchedUsers || [];
      setUsers(safeUsers);

      const authOnlyCount = safeUsers.filter(u => u.auth_only).length;
      const profileCount = safeUsers.filter(u => u.has_profile).length;

      console.log('📊 [UserManagement] User breakdown:', {
        total: safeUsers.length,
        authOnly: authOnlyCount,
        withProfile: profileCount
      });

      if (safeUsers.length === 0) {
        setConnectionStatus('No users found in system. Database connection successful.');
      } else {
        setConnectionStatus(
          `Successfully loaded ${safeUsers.length} total users ` +
          `(${profileCount} with profiles, ${authOnlyCount} auth-only)`
        );
      }

    } catch (error: any) {
      console.error('❌ [UserManagement] Error fetching users:', error);
      setConnectionStatus(`Error: ${error.message}`);
      setUsers([]); // Set empty array instead of showing error toast
      // Remove the error toast - just log the error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const syncAuthUsersToProfiles = async () => {
    try {
      setSyncing(true);
      console.log('🔄 Syncing Auth users to Profiles...');
      
      const authOnlyUsers = users.filter(u => u.auth_only);
      
      if (authOnlyUsers.length === 0) {
        toast({
          title: "No sync needed",
          description: "All Auth users already have profiles.",
        });
        return;
      }

      await adminUserService.createMissingProfiles(authOnlyUsers);
      
      toast({
        title: "Sync Successful",
        description: `Created profiles for ${authOnlyUsers.length} users.`,
        className: "bg-green-50 border-green-200"
      });

      // Refresh data after sync
      await fetchUsers();
      
    } catch (error: any) {
      console.error('❌ Error syncing users:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync Auth users to profiles.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const channel = supabase
      .channel('user-management-admin')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles'
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateStats = () => {
    const totalUsers = users.filter(u => u.user_type === 'user').length;
    const totalTalents = users.filter(u => u.user_type === 'companion').length;
    const totalAdmins = users.filter(u => u.user_type === 'admin').length;
    const verifiedUsers = users.filter(u => u.verification_status === 'verified').length;
    const pendingApprovals = users.filter(u => u.verification_status === 'pending').length;
    const authOnlyUsers = users.filter(u => u.auth_only).length;

    setStats({
      totalUsers,
      totalTalents,
      totalAdmins,
      verifiedUsers,
      pendingApprovals,
      authOnlyUsers
    });
  };

  const updateUserStatus = async (userId: string, newStatus: VerificationStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, verification_status: newStatus }
            : user
        )
      );

      toast({
        title: "User Updated",
        description: `User status has been updated to ${newStatus}`,
      });

    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    const matchesStatus = filterStatus === 'all' || user.verification_status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getUserTypeBadge = (userType: UserType) => {
    switch (userType) {
      case 'companion':
        return <Badge className="bg-purple-100 text-purple-600">Talent</Badge>;
      case 'admin':
        return <Badge className="bg-red-100 text-red-600">Admin</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-600">User</Badge>;
    }
  };

  const getStatusBadge = (status: VerificationStatus, authOnly: boolean) => {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Regular users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Talents</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalTalents}</div>
            <p className="text-xs text-muted-foreground">Companion talents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">System admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">Verified accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Only</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.authOnlyUsers}</div>
            <p className="text-xs text-muted-foreground">Missing profiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Connection Status */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Enhanced Database Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Connection Method:</strong> Auth + Database Query</p>
            <p><strong>Status:</strong> {connectionStatus}</p>
            <p><strong>Total users loaded:</strong> {users.length}</p>
            <p><strong>Auth-only users:</strong> {stats.authOnlyUsers}</p>
            
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchUsers}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              
              {stats.authOnlyUsers > 0 && (
                <Button 
                  size="sm" 
                  onClick={syncAuthUsersToProfiles}
                  disabled={syncing}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600"
                >
                  <ArrowUpDown className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Auth to Profiles ({stats.authOnlyUsers})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | UserType)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="companion">Talents</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | VerificationStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {users.length === 0 ? (
                <div>
                  <p>No users found in system.</p>
                  <Button onClick={fetchUsers} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : (
                "No users match your search criteria."
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{user.name || 'No name'}</div>
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
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUserTypeBadge(user.user_type)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.verification_status, user.auth_only)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {user.has_profile && user.auth_only ? (
                          <Badge variant="secondary">Both</Badge>
                        ) : user.has_profile ? (
                          <Badge className="bg-green-100 text-green-600">Profile</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-600">Auth Only</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewUser(user)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {user.verification_status === 'pending' && user.user_type !== 'admin' && user.has_profile && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => updateUserStatus(user.id, 'verified')}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateUserStatus(user.id, 'rejected')}
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showUserDetail}
        onClose={() => {
          setShowUserDetail(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default UserManagement;
