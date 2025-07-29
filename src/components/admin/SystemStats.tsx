
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Star, CreditCard, AlertTriangle, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  totalUsers: number;
  totalTalents: number;
  pendingApprovals: number;
  verifiedUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingPayments: number;
  activeBookings: number;
  todaySignups: number;
  todayTransactions: number;
}

const SystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTalents: 0,
    pendingApprovals: 0,
    verifiedUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeBookings: 0,
    todaySignups: 0,
    todayTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
    setupRealTimeUpdates();
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Get user stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_type, verification_status, created_at');

      if (profilesError) throw profilesError;

      // Get transaction stats  
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, status, created_at');

      if (transactionsError) throw transactionsError;

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalUsers = profiles?.filter(p => p.user_type === 'user').length || 0;
      const totalTalents = profiles?.filter(p => p.user_type === 'companion').length || 0;
      const pendingApprovals = profiles?.filter(p => p.verification_status === 'pending').length || 0;
      const verifiedUsers = profiles?.filter(p => p.verification_status === 'verified').length || 0;
      
      const todaySignups = profiles?.filter(p => 
        new Date(p.created_at) >= today
      ).length || 0;

      const totalTransactions = transactions?.length || 0;
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const pendingPayments = transactions?.filter(t => 
        t.status === 'pending_verification'
      ).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const todayTransactions = transactions?.filter(t =>
        new Date(t.created_at) >= today
      ).length || 0;

      setStats({
        totalUsers,
        totalTalents,
        pendingApprovals,
        verifiedUsers,
        totalTransactions,
        totalRevenue,
        pendingPayments,
        activeBookings: 0, // Would need bookings table
        todaySignups,
        todayTransactions
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    // Subscribe to profile changes
    const profilesChannel = supabase
      .channel('profiles-stats')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchSystemStats()
      )
      .subscribe();

    // Subscribe to transaction changes
    const transactionsChannel = supabase
      .channel('transactions-stats')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchSystemStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.todaySignups} today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Talents</CardTitle>
          <Star className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalTalents}</div>
          <p className="text-xs text-muted-foreground">
            Active talents
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
          <p className="text-xs text-muted-foreground">
            Need review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</div>
          <p className="text-xs text-muted-foreground">
            Active accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Rp {(stats.totalRevenue / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-muted-foreground">
            All time revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.todayTransactions} today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            Rp {(stats.pendingPayments / 1000).toFixed(0)}K
          </div>
          <p className="text-xs text-muted-foreground">
            Need verification
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
          <Calendar className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {stats.todaySignups + stats.todayTransactions}
          </div>
          <p className="text-xs text-muted-foreground">
            Signups + Transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStats;
