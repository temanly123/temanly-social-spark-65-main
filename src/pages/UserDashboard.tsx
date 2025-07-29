import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Star, Calendar, DollarSign, User, CheckCircle, AlertTriangle, Heart, TrendingUp, Clock, Award, Shield, Phone, Mail, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FavoritesService, FavoriteWithTalent } from '@/services/favoritesService';
import DashboardHeader from '@/components/DashboardHeader';
import UserServiceHistory from '@/components/user/UserServiceHistory';
import UserWallet from '@/components/user/UserWallet';
import ProfileSettings from '@/components/ProfileSettings';
import ProfileDebugger from '@/components/ProfileDebugger';
import ConversationList from '@/components/chat/ConversationList';
import ChatBox from '@/components/chat/ChatBox';
import { Conversation } from '@/services/chatService';

interface UserStats {
  totalSpent: number;
  completedBookings: number;
  favoriteCount: number;
  verificationStatus: string;
  activeBookings: number;
  averageRating: number;
  memberSince: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteWithTalent[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatBox, setShowChatBox] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalSpent: 0,
    completedBookings: 0,
    favoriteCount: 0,
    verificationStatus: 'pending',
    activeBookings: 0,
    averageRating: 4.8,
    memberSince: '2024-01-01',
    emailVerified: false,
    phoneVerified: false
  });

  useEffect(() => {
    if (user && user.id) {
      fetchUserStats();
    }
  }, [user?.id]); // Only re-run when user ID changes, not the entire user object



  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch user bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

      // Fetch user transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      const completedBookings = bookings?.filter(b => b.booking_status === 'completed') || [];
      const activeBookings = bookings?.filter(b => 
        ['confirmed', 'in_progress', 'waiting_companion_contact'].includes(b.booking_status)
      ) || [];

      const totalSpent = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Fetch user favorites (with error handling)
      let userFavorites: any[] = [];
      try {
        userFavorites = await FavoritesService.getUserFavorites(user.id);
        setFavorites(userFavorites);
      } catch (favError) {
        console.log('Favorites table not available yet:', favError);
        // Don't fail the entire dashboard if favorites aren't available
        setFavorites([]);
      }

      setStats({
        totalSpent,
        completedBookings: completedBookings.length,
        favoriteCount: userFavorites.length,
        verificationStatus: profile?.verification_status || 'pending',
        activeBookings: activeBookings.length,
        averageRating: 0, // Will be calculated from actual reviews
        memberSince: profile?.created_at || '2024-01-01',
        emailVerified: !!user.email,
        phoneVerified: !!profile?.phone
      });

    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (value: string) => {
    // Prevent any potential page reload
    if (value === activeTab) return;
    setActiveTab(value);

    // Refresh favorites when switching to favorites tab
    if (value === 'favorites' && user) {
      try {
        console.log('🔄 [UserDashboard] Refreshing favorites...');
        const userFavorites = await FavoritesService.getUserFavorites(user.id);
        setFavorites(userFavorites);
        setStats(prev => ({ ...prev, favoriteCount: userFavorites.length }));
        console.log('✅ [UserDashboard] Favorites refreshed:', userFavorites.length);
      } catch (error) {
        console.error('❌ [UserDashboard] Error refreshing favorites:', error);
      }
    }
  };

  const getVerificationProgress = () => {
    let progress = 0;
    if (stats.emailVerified) progress += 25;
    if (stats.phoneVerified) progress += 25;
    if (user?.name) progress += 25;
    if (stats.verificationStatus === 'verified') progress += 25;
    return progress;
  };

  const handleCompleteVerification = () => {
    console.log('Verification button clicked, navigating to document verification');
    navigate('/document-verification');
  };

  const canAccessRestrictedServices = () => {
    return stats.verificationStatus === 'verified';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">
              Please log in to access your dashboard.
            </p>
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="User Dashboard"
        subtitle={`Selamat datang kembali, ${user?.name || 'User'}!`}
        userType="user"
        notificationCount={0}
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6" defaultValue="overview">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Layanan Saya</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="favorites">Favorit</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Verification Alert */}
            {stats.verificationStatus !== 'verified' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-yellow-800">Verifikasi Akun Diperlukan</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Verifikasi akun Anda untuk mengakses layanan Offline Date dan Party Buddy.
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-3"
                        onClick={handleCompleteVerification}
                      >
                        Verifikasi Sekarang
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={(e) => { e.preventDefault(); handleTabChange('wallet'); }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Rp {(stats.totalSpent / 1000).toFixed(0)}K</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    Total dari {stats.completedBookings} booking
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={(e) => { e.preventDefault(); handleTabChange('services'); }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Booking Aktif</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeBookings}</div>
                  <p className="text-xs text-muted-foreground">Sedang berlangsung</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={(e) => { e.preventDefault(); handleTabChange('favorites'); }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Talent Favorit</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.favoriteCount}</div>
                  <p className="text-xs text-muted-foreground">Disimpan untuk booking cepat</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating Rata-rata</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <p className="text-xs text-muted-foreground">
                    <Star className="w-3 h-3 inline mr-1 text-yellow-400" />
                    Dari {stats.completedBookings} booking
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Status Akun
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Kelengkapan Profil</span>
                    <div className="flex items-center gap-2">
                      <Progress value={getVerificationProgress()} className="w-20" />
                      <span className="text-sm">{Math.round(getVerificationProgress())}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Email</span>
                      </div>
                      <Badge className={stats.emailVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {stats.emailVerified ? 'Terverifikasi' : 'Belum'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">WhatsApp</span>
                      </div>
                      <Badge className={stats.phoneVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {stats.phoneVerified ? 'Terverifikasi' : 'Belum'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Verifikasi KTP</span>
                      </div>
                      <Badge className={stats.verificationStatus === 'verified' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}>
                        {stats.verificationStatus === 'verified' ? 'Terverifikasi' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {stats.verificationStatus !== 'verified' && (
                    <Button 
                      onClick={handleCompleteVerification}
                      className="w-full mt-4"
                    >
                      Lengkapi Verifikasi
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Service Access */}
              <Card>
                <CardHeader>
                  <CardTitle>Akses Layanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Layanan Tersedia</span>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Chat - Rp 25.000/hari</li>
                        <li>• Voice Call - Rp 40.000/jam</li>
                        <li>• Video Call - Rp 65.000/jam</li>
                        <li>• Rent a Lover - mulai Rp 85.000/hari</li>
                      </ul>
                    </div>

                    {!canAccessRestrictedServices() && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Perlu Verifikasi</span>
                        </div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Offline Date - Rp 285.000/3 jam</li>
                          <li>• Party Buddy - Rp 1.000.000/event</li>
                        </ul>
                        <p className="text-xs text-yellow-600 mt-2">
                          Verifikasi KTP diperlukan untuk mengakses layanan ini
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <UserServiceHistory />
          </TabsContent>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ConversationList
                  onConversationSelect={(conversation) => {
                    setSelectedConversation(conversation);
                    setShowChatBox(true);
                  }}
                  selectedConversationId={selectedConversation?.id}
                />
              </div>
              <div className="lg:col-span-1">
                {selectedConversation ? (
                  <div className="sticky top-4">
                    <ChatBox
                      conversation={selectedConversation}
                      onClose={() => {
                        setShowChatBox(false);
                        setSelectedConversation(null);
                      }}
                      className="h-[600px]"
                    />
                  </div>
                ) : (
                  <Card className="h-[600px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Select a conversation</p>
                      <p className="text-sm">Choose a conversation from the list to start chatting</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wallet">
            <UserWallet />
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Talent Favorit
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Simpan talent favorit untuk booking yang lebih mudah
                </p>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada talent favorit</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Mulai explore dan simpan talent favorit Anda!
                      {stats.favoriteCount === 0 && (
                        <span className="block mt-2 text-xs text-blue-600">
                          💡 Tip: Klik ❤️ pada talent card untuk menambahkan ke favorit
                        </span>
                      )}
                    </p>
                    <Button onClick={() => navigate('/talents')}>
                      Browse Talents
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {favorites.map((favorite) => (
                      <Card key={favorite.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold text-lg">
                            {favorite.talent.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{favorite.talent.name}</h3>
                            <p className="text-sm text-gray-600">{favorite.talent.location}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm">{favorite.talent.average_rating || 0}</span>
                              <span className="text-sm text-gray-500">({favorite.talent.total_orders || 0} orders)</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/book-talent/${favorite.talent.id}`)}
                            >
                              Book Now
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await FavoritesService.removeFromFavorites(user!.id, favorite.talent.id);
                                  setFavorites(prev => prev.filter(f => f.id !== favorite.id));
                                  setStats(prev => ({ ...prev, favoriteCount: prev.favoriteCount - 1 }));
                                  toast({
                                    title: "Removed from Favorites",
                                    description: `${favorite.talent.name} has been removed from your favorites.`,
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to remove from favorites.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <Heart className="w-4 h-4 text-red-500 fill-current" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <ProfileSettings userType="user" />
              <ProfileDebugger />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;