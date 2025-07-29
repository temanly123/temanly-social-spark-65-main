
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, UserPlus, CreditCard, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  type: 'user_signup' | 'talent_signup' | 'transaction' | 'booking';
  user_id: string;
  user_name: string;
  user_email: string;
  description: string;
  amount?: number;
  status: string;
  created_at: string;
}

const RealTimeActivityMonitor = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentActivities();
    setupRealTimeSubscription();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent user signups
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (profilesError) throw profilesError;

      // Fetch recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;

      // Combine and format activities
      const combinedActivities: Activity[] = [];

      // Add profile activities
      profiles?.forEach(profile => {
        combinedActivities.push({
          id: `profile_${profile.id}`,
          type: profile.user_type === 'companion' ? 'talent_signup' : 'user_signup',
          user_id: profile.id,
          user_name: profile.name || 'Unknown',
          user_email: profile.email || '',
          description: profile.user_type === 'companion' 
            ? `New talent registered: ${profile.name}` 
            : `New user registered: ${profile.name}`,
          status: profile.verification_status || 'pending',
          created_at: profile.created_at
        });
      });

      // Add transaction activities
      transactions?.forEach(transaction => {
        combinedActivities.push({
          id: `transaction_${transaction.id}`,
          type: 'transaction',
          user_id: transaction.user_id,
          user_name: 'User',
          user_email: '',
          description: `New transaction for ${transaction.service}`,
          amount: transaction.amount,
          status: transaction.status,
          created_at: transaction.created_at
        });
      });

      // Sort by created_at
      combinedActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(combinedActivities.slice(0, 50));
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load recent activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    // Subscribe to profiles changes (new signups)
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('New profile created:', payload);
          const newProfile = payload.new as any;
          const newActivity: Activity = {
            id: `profile_${newProfile.id}`,
            type: newProfile.user_type === 'companion' ? 'talent_signup' : 'user_signup',
            user_id: newProfile.id,
            user_name: newProfile.name || 'Unknown',
            user_email: newProfile.email || '',
            description: newProfile.user_type === 'companion' 
              ? `New talent registered: ${newProfile.name}` 
              : `New user registered: ${newProfile.name}`,
            status: newProfile.verification_status || 'pending',
            created_at: newProfile.created_at
          };
          
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
          toast({
            title: "New Activity",
            description: newActivity.description,
            className: "bg-blue-50 border-blue-200"
          });
        }
      )
      .subscribe();

    // Subscribe to transactions changes
    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('New transaction created:', payload);
          const newTransaction = payload.new as any;
          const newActivity: Activity = {
            id: `transaction_${newTransaction.id}`,
            type: 'transaction',
            user_id: newTransaction.user_id,
            user_name: 'User',
            user_email: '',
            description: `New transaction for ${newTransaction.service}`,
            amount: newTransaction.amount,
            status: newTransaction.status,
            created_at: newTransaction.created_at
          };
          
          setActivities(prev => [newActivity, ...prev].slice(0, 50));
          toast({
            title: "New Transaction",
            description: `Rp ${newTransaction.amount.toLocaleString('id-ID')} - ${newTransaction.service}`,
            className: "bg-green-50 border-green-200"
          });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaction updated:', payload);
          const updatedTransaction = payload.new as any;
          toast({
            title: "Transaction Updated",
            description: `Transaction status: ${updatedTransaction.status}`,
            className: "bg-yellow-50 border-yellow-200"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'talent_signup':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'transaction':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    const getColor = () => {
      if (type === 'transaction') {
        switch (status) {
          case 'paid': return 'bg-green-100 text-green-600';
          case 'pending_verification': return 'bg-yellow-100 text-yellow-600';
          case 'failed': return 'bg-red-100 text-red-600';
          default: return 'bg-gray-100 text-gray-600';
        }
      } else {
        switch (status) {
          case 'verified': return 'bg-green-100 text-green-600';
          case 'pending': return 'bg-yellow-100 text-yellow-600';
          case 'rejected': return 'bg-red-100 text-red-600';
          default: return 'bg-gray-100 text-gray-600';
        }
      }
    };

    return (
      <Badge className={getColor()}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Real-Time Activity Monitor ({activities.length})
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchRecentActivities();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="font-medium text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{activity.user_email}</span>
                      <span>•</span>
                      <span>{new Date(activity.created_at).toLocaleString('id-ID')}</span>
                      {activity.amount && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-green-600">
                            Rp {activity.amount.toLocaleString('id-ID')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activity.status, activity.type)}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent activities found.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RealTimeActivityMonitor;
