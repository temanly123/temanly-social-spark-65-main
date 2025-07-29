import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Mail, Phone, User, RefreshCw, Database, AlertCircle, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database as DatabaseType } from '@/integrations/supabase/types';
import { adminUserService, AdminUser } from '@/services/adminUserService';

type UserType = DatabaseType['public']['Enums']['user_type'];
type VerificationStatus = DatabaseType['public']['Enums']['verification_status'];

const UserApprovalManagement = () => {
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
    setupRealTimeUpdates();
  }, []);

  const fetchAllData = async () => {
    try {
      console.log('🔍 UserApprovalManagement: Starting comprehensive data fetch...');
      setRefreshing(true);
      setConnectionStatus('Connecting to database and Auth...');
      
      const { users, error } = await adminUserService.getAllUsers();
      
      if (error) {
        throw new Error(error);
      }

      // Filter for pending approvals - focus on regular users, not talents
      const pendingUsers = users.filter(user => 
        user.verification_status === 'pending' && 
        user.user_type !== 'companion' // Exclude talents as they have their own management
      );
      
      const authOnlyUsers = users.filter(user => user.auth_only);
      
      console.log('✅ PENDING REGULAR USERS found:', pendingUsers.length);
      console.log('✅ AUTH-ONLY USERS found:', authOnlyUsers.length);

      setAllUsers(users);
      setPendingUsers(pendingUsers);

      // Debug: Check what verification statuses exist
      const statusBreakdown = users.reduce((acc: any, user) => {
        acc[user.verification_status] = (acc[user.verification_status] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Verification status breakdown:', statusBreakdown);

      const debugData = {
        totalUsers: users.length,
        pendingUsers: pendingUsers.length,
        pendingTalents: users.filter(u => u.verification_status === 'pending' && u.user_type === 'companion').length,
        authOnlyUsers: authOnlyUsers.length,
        statusBreakdown,
        sampleUsers: users.slice(0, 3).map(u => ({
          id: u.id.slice(0, 8),
          email: u.email,
          status: u.verification_status,
          type: u.user_type,
          authOnly: u.auth_only
        }))
      };

      setDebugInfo(debugData);
      setConnectionStatus(
        `Loaded ${users.length} total users, ${pendingUsers.length} pending regular users, ${debugData.pendingTalents} pending talents, ${authOnlyUsers.length} auth-only`
      );

    } catch (error: any) {
      console.error('❌ Error in fetchAllData:', error);
      setConnectionStatus(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: "Gagal memuat data user yang menunggu approval",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const syncAuthUsersToProfiles = async () => {
    try {
      setSyncing(true);
      console.log('🔄 Syncing Auth users to Profiles...');
      
      const authOnlyUsers = allUsers.filter(u => u.auth_only);
      
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
      await fetchAllData();
      
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
      .channel('pending-users-admin')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: 'verification_status=eq.pending'
        },
        (payload) => {
          console.log('🔄 Real-time update received for pending users:', payload);
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      const status: VerificationStatus = approved ? 'verified' : 'rejected';
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Send notification email
      await sendApprovalNotification(userId, approved);

      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: approved ? "User Approved" : "User Rejected",
        description: `User has been ${approved ? 'approved' : 'rejected'} and notified via email.`
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

  const sendApprovalNotification = async (userId: string, approved: boolean) => {
    try {
      await supabase.functions.invoke('send-approval-notification', {
        body: { userId, approved }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading pending approvals...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const authOnlyUsers = allUsers.filter(u => u.auth_only);

  return (
    <div className="space-y-6">
      {/* Enhanced Debug Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Enhanced Database Debug Information - Regular User Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Total Users in System:</strong> {debugInfo.totalUsers}</p>
                <p><strong>Pending Regular Users:</strong> {debugInfo.pendingUsers}</p>
                <p><strong>Pending Talents:</strong> {debugInfo.pendingTalents} (managed in Talent Registration tab)</p>
                <p><strong>Auth-Only Users:</strong> {debugInfo.authOnlyUsers}</p>
                <p><strong>Connection Status:</strong> {connectionStatus}</p>
              </div>
              <div>
                <p><strong>Status Breakdown:</strong></p>
                <ul className="ml-4 text-xs">
                  {Object.entries(debugInfo.statusBreakdown || {}).map(([status, count]) => (
                    <li key={status}>• {status}: {count as number}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-2">Sample Users:</p>
              <div className="text-xs space-y-1">
                {debugInfo.sampleUsers?.map((user: any, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <span>ID: {user.id}</span>
                    <span>Email: {user.email}</span>
                    <span>Status: <strong>{user.status}</strong></span>
                    <span>Type: {user.type}</span>
                    {user.authOnly && <span className="text-orange-600">Auth-Only</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchAllData}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              
              {authOnlyUsers.length > 0 && (
                <Button 
                  size="sm" 
                  onClick={syncAuthUsersToProfiles}
                  disabled={syncing}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600"
                >
                  <ArrowUpDown className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Auth to Profiles ({authOnlyUsers.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Regular User Approvals ({pendingUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 space-y-4">
              <div>
                <p className="text-lg">No pending regular user approvals found.</p>
                <p className="text-sm mt-2 text-gray-600">
                  Regular users (type: 'user') with 'pending' status will appear here.
                </p>
                <p className="text-sm text-blue-600">
                  💡 Talent approvals are managed in the "Talent Registration" tab.
                </p>
                {debugInfo.pendingTalents > 0 && (
                  <p className="text-sm text-orange-600">
                    Found {debugInfo.pendingTalents} pending talents - check Talent Registration tab.
                  </p>
                )}
                {authOnlyUsers.length > 0 && (
                  <p className="text-sm text-orange-600">
                    {authOnlyUsers.length} users exist in Auth but don't have profiles yet.
                  </p>
                )}
              </div>
              
              {authOnlyUsers.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-800 mb-3">
                    <strong>Action Required:</strong> Some users registered in Auth but don't have profiles. 
                    Sync them to create profiles and enable approval workflow.
                  </p>
                  <Button 
                    onClick={syncAuthUsersToProfiles} 
                    disabled={syncing}
                    className="bg-orange-500 hover:bg-orange-600"
                    size="sm"
                  >
                    <ArrowUpDown className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    Sync {authOnlyUsers.length} Auth Users to Profiles
                  </Button>
                </div>
              )}
              
              <Button onClick={fetchAllData} className="mt-4" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                          {user.auth_only && (
                            <Badge className="bg-orange-100 text-orange-600 text-xs">Auth Only</Badge>
                          )}
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
                      <Badge 
                        variant={user.user_type === 'companion' ? 'default' : user.user_type === 'admin' ? 'destructive' : 'secondary'}
                      >
                        {user.user_type === 'companion' ? 'Talent' : user.user_type === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.has_profile ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApproval(user.id, true)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(user.id, false)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <div className="text-sm text-orange-600">
                            No profile - sync required
                          </div>
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
    </div>
  );
};

export default UserApprovalManagement;
