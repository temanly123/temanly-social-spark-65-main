import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, Calendar, DollarSign, Users, Clock, Settings, TrendingUp, Wallet, FileText, User, Eye, CheckCircle, Camera, Upload, Trash2, Image as ImageIcon, Plus, X, XCircle, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/DashboardHeader';
import ConversationList from '@/components/chat/ConversationList';
import ChatBox from '@/components/chat/ChatBox';
import { Conversation } from '@/services/chatService';


interface TalentProfile {
  id: string;
  name: string;
  bio: string;
  zodiac: string;
  love_language: string;
  hourly_rate: number;
  level: string;
  status: string;
  rating: number;
  total_orders: number;
  total_earnings: number;
  is_available: boolean;
}

interface Booking {
  id: string;
  user_name: string;
  service_type: string;
  date: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  companion_earnings: number | null;
  status: string;
  created_at: string;
  booking_id?: string;
  service: string;
}

const TalentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<TalentProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatBox, setShowChatBox] = useState(false);

  // Ref to track if data has been fetched to prevent unnecessary re-fetches
  const dataFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const availableServices = [
    { id: 'chat' as const, name: 'Chat', basePrice: 25000 },
    { id: 'call' as const, name: 'Call', basePrice: 40000 },
    { id: 'video_call' as const, name: 'Video Call', basePrice: 65000 },
    { id: 'offline_date' as const, name: 'Offline Date', basePrice: 285000 },
    { id: 'party_buddy' as const, name: 'Party Buddy', basePrice: 1000000 },
    { id: 'rent_lover' as const, name: 'Rent a Lover', basePrice: 85000 }
  ];

  const interests = [
    'Sushi Date', 'Museum Date', 'Picnic Date', 'Movie Date', 
    'Golf', 'Tennis', 'Coffee Shop', 'Shopping', 'Karaoke', 'Gaming',
    'Art Gallery', 'Concert', 'Theater', 'Hiking', 'Beach Walk'
  ];

  useEffect(() => {
    if (user) {
      console.log('TalentDashboard: User state:', {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        name: user.name
      });

      // Check if user is a companion
      if (user.user_type !== 'companion') {
        console.log('TalentDashboard: Access denied - user_type is not companion:', user.user_type);
        toast({
          title: "Access Denied",
          description: "Only talents can access this dashboard",
          variant: "destructive"
        });
        return;
      }

      // Only fetch data if user ID has changed or data hasn't been fetched yet
      if (!dataFetchedRef.current || lastUserIdRef.current !== user.id) {
        console.log('TalentDashboard: Access granted - fetching talent data');
        lastUserIdRef.current = user.id;
        dataFetchedRef.current = true;
        fetchTalentData();
      } else {
        console.log('TalentDashboard: Data already fetched for this user, skipping');
      }
    }
  }, [user]); // Removed toast from dependencies

  // Function to manually recalculate and update rating
  const recalculateRating = async () => {
    if (!user) return;

    try {
      console.log('🔄 Manual rating recalculation triggered for user:', user.id);

      // Get all reviews for this talent
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating, is_verified')
        .eq('reviewee_id', user.id);

      console.log('📊 Found reviews:', allReviews);

      // Calculate from verified reviews first, fallback to all reviews
      const verifiedReviews = allReviews?.filter(r => r.is_verified) || [];
      const reviewsToUse = verifiedReviews.length > 0 ? verifiedReviews : (allReviews || []);

      const avgRating = reviewsToUse.length > 0
        ? reviewsToUse.reduce((sum, r) => sum + r.rating, 0) / reviewsToUse.length
        : 0;

      // Get completed bookings count
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('companion_id', user.id)
        .eq('booking_status', 'completed');

      const completedBookings = bookings?.length || 0;

      console.log('📈 Calculation results:', {
        total_reviews: allReviews?.length || 0,
        verified_reviews: verifiedReviews.length,
        reviews_used: reviewsToUse.length,
        calculated_rating: avgRating,
        completed_bookings: completedBookings
      });

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          average_rating: Math.round(avgRating * 100) / 100,
          rating: Math.round(avgRating * 100) / 100,
          total_orders: completedBookings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating rating:', updateError);
      } else {
        console.log('✅ Rating updated successfully in database');

        // Update local state
        setProfileData(prev => ({
          ...prev,
          rating: Math.round(avgRating * 100) / 100,
          total_orders: completedBookings
        }));
      }

    } catch (error) {
      console.error('❌ Error recalculating rating:', error);
    }
  };

  const fetchTalentData = async () => {
    if (!user) return;

    try {
      console.log('🔄 Starting fetchTalentData for user:', user.id, 'at', new Date().toISOString());
      console.trace('fetchTalentData called from:'); // This will show the call stack
      setLoading(true);
      
      // Fetch talent profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch talent services (optional - fallback to profile data)
      const { data: services } = await supabase
        .from('talent_services')
        .select('service_type')
        .eq('talent_id', user.id);

      // Fetch talent interests (optional - fallback to profile data)
      const { data: talentInterests } = await supabase
        .from('talent_interests')
        .select('interest')
        .eq('talent_id', user.id);

      // Fetch bookings
      console.log('🔍 TalentDashboard: Fetching bookings for companion_id:', user.id);
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_type,
          service_name,
          date,
          total_price,
          booking_status,
          created_at,
          customer_name,
          user_id,
          companion_id,
          profiles!user_id(name)
        `)
        .eq('companion_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('📊 TalentDashboard: Bookings query result:', {
        data: bookingsData,
        error: bookingsError,
        companionId: user.id
      });

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('companion_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Calculate stats
      const completedBookings = bookingsData?.filter(b => b.booking_status === 'completed') || [];
      const totalEarnings = transactionsData?.reduce((sum, t) => 
        t.companion_earnings ? sum + t.companion_earnings : sum, 0) || 0;
      
      // Calculate actual rating from profile data or reviews
      const avgRating = (profile as any).average_rating || (profile as any).rating || 0;

      // Debug log to see what's in the profile
      console.log('Profile rating data:', {
        average_rating: (profile as any).average_rating,
        rating: (profile as any).rating,
        total_orders: (profile as any).total_orders,
        calculated_rating: avgRating
      });

      setProfileData({
        id: profile.id,
        name: profile.name || profile.full_name || 'Talent',
        bio: profile.bio || '',
        zodiac: profile.zodiac || '',
        love_language: profile.love_language || '',
        hourly_rate: profile.hourly_rate || 85000,
        level: profile.talent_level || 'Fresh Talent',
        status: profile.status || 'active',
        rating: avgRating,
        total_orders: completedBookings.length,
        total_earnings: totalEarnings,
        is_available: profile.is_available !== false
      });

      // Use services from separate table or fallback to profile data
      const profileServices = (profile as any).available_services || [];
      const profileInterests = (profile as any).interests || [];

      setSelectedServices(services?.map(s => s.service_type) || profileServices);
      setSelectedInterests(talentInterests?.map(i => i.interest) || profileInterests);
      
      const mappedBookings = bookingsData?.map(b => ({
        id: b.id,
        user_name: b.profiles?.name || b.customer_name || 'Unknown User',
        service_type: b.service_type || b.service_name || 'Unknown',
        date: b.date,
        amount: b.total_price,
        status: b.booking_status || 'pending',
        created_at: b.created_at || ''
      })) || [];

      console.log('📋 Mapped bookings (filtered):', mappedBookings);
      setBookings(mappedBookings);
      setTransactions(transactionsData || []);

      // Fetch gallery images
      const { data: gallery, error: galleryError } = await supabase
        .from('talent_gallery')
        .select('*')
        .eq('talent_id', user.id)
        .order('display_order', { ascending: true });

      if (galleryError) {
        console.error('❌ Gallery fetch error:', galleryError);
        console.error('Gallery error details:', {
          message: galleryError.message,
          code: galleryError.code,
          details: galleryError.details,
          hint: galleryError.hint
        });

        // Don't show error toast for missing table - just log it
        if (!galleryError.message?.includes('relation "talent_gallery" does not exist')) {
          toast({
            title: "Warning",
            description: "Tidak dapat memuat galeri foto",
            variant: "destructive"
          });
        }
        setGalleryImages([]);
      } else {
        console.log('✅ Gallery data:', gallery);
        setGalleryImages(gallery || []);
      }

    } catch (error: any) {
      console.error('Error fetching talent data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data talent",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  // Gallery management functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚀 handleImageUpload called!', event);
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file);
    console.log('👤 User ID:', user?.id);

    if (!file || !user?.id) {
      console.error('Upload failed: Missing file or user ID', { file: !!file, userId: user?.id });
      return;
    }

    console.log('🔄 Starting image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id,
      currentGalleryCount: galleryImages.length
    });

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format file salah",
        description: "Hanya file gambar yang diperbolehkan",
        variant: "destructive"
      });
      return;
    }

    // Check if user already has 5 images
    if (galleryImages.length >= 5) {
      toast({
        title: "Batas maksimal tercapai",
        description: "Anda hanya dapat mengunggah maksimal 5 foto",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);

      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      console.log('✅ File converted to base64, length:', base64Data.length);

      // Save to database
      console.log('💾 Inserting into talent_gallery table...');
      const insertData = {
        talent_id: user.id,
        image_url: base64Data,
        caption: `Photo ${galleryImages.length + 1}`,
        display_order: galleryImages.length + 1
      };
      console.log('📝 Insert data:', { ...insertData, image_url: `${base64Data.substring(0, 50)}...` });

      const { data, error } = await supabase
        .from('talent_gallery')
        .insert(insertData)
        .select()
        .single();

      console.log('📊 Database response:', { data: !!data, error });
      if (error) throw error;

      // Update local state
      setGalleryImages(prev => [...prev, data]);

      toast({
        title: "Foto berhasil diunggah",
        description: "Foto telah ditambahkan ke galeri Anda",
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      let errorMessage = "Gagal mengunggah foto";
      if (error.message?.includes('relation "talent_gallery" does not exist')) {
        errorMessage = "Tabel galeri belum dibuat. Hubungi administrator.";
      } else if (error.message?.includes('permission denied')) {
        errorMessage = "Tidak memiliki izin untuk mengunggah foto.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('talent_gallery')
        .delete()
        .eq('id', imageId)
        .eq('talent_id', user.id);

      if (error) throw error;

      // Update local state
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));

      toast({
        title: "Foto berhasil dihapus",
        description: "Foto telah dihapus dari galeri Anda",
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus foto",
        variant: "destructive"
      });
    }
  };

  // Update booking status function
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        toast({
          title: "Error",
          description: "Failed to update booking status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`,
      });

      // Refresh data
      fetchTalentData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  const handleAvailabilityToggle = async (checked: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: checked })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData(prev => prev ? { ...prev, is_available: checked } : null);
      
      toast({
        title: checked ? "Sekarang tersedia" : "Sekarang tidak tersedia",
        description: checked ? "User dapat memesan layanan Anda." : "User tidak dapat memesan layanan Anda.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengubah status ketersediaan",
        variant: "destructive"
      });
    }
  };

  const handleServiceToggle = async (serviceId: string) => {
    if (!user) return;

    try {
      const isCurrentlySelected = selectedServices.includes(serviceId);
      
      if (isCurrentlySelected) {
        // Remove service
        await supabase
          .from('talent_services')
          .delete()
          .eq('talent_id', user.id)
          .eq('service_type', serviceId as any);
        
        setSelectedServices(prev => prev.filter(id => id !== serviceId));
      } else {
        // Add service
        await supabase
          .from('talent_services')
          .insert({
            talent_id: user.id,
            service_type: serviceId as any,
            custom_rate: availableServices.find(s => s.id === serviceId)?.basePrice || 0
          });
        
        setSelectedServices(prev => [...prev, serviceId]);
      }

      toast({
        title: "Layanan diperbarui",
        description: `Layanan ${serviceId} ${isCurrentlySelected ? 'dihapus' : 'ditambahkan'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengubah layanan",
        variant: "destructive"
      });
    }
  };

  const handleInterestToggle = async (interest: string) => {
    if (!user) return;

    try {
      const isCurrentlySelected = selectedInterests.includes(interest);
      
      if (isCurrentlySelected) {
        await supabase
          .from('talent_interests')
          .delete()
          .eq('talent_id', user.id)
          .eq('interest', interest);
        
        setSelectedInterests(prev => prev.filter(i => i !== interest));
      } else {
        await supabase
          .from('talent_interests')
          .insert({
            talent_id: user.id,
            interest: interest
          });
        
        setSelectedInterests(prev => [...prev, interest]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengubah minat",
        variant: "destructive"
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileData) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          bio: profileData.bio,
          zodiac: profileData.zodiac,
          love_language: profileData.love_language,
          hourly_rate: profileData.hourly_rate
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profil disimpan",
        description: "Profil Anda berhasil diperbarui.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menyimpan profil",
        variant: "destructive"
      });
    }
  };





  const handleWithdrawalRequest = async () => {
    if (!user || !withdrawalAmount || !bankAccount) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(withdrawalAmount);
    if (amount < 50000) {
      toast({
        title: "Error",
        description: "Minimal penarikan Rp 50.000",
        variant: "destructive"
      });
      return;
    }

    if (profileData && amount > profileData.total_earnings) {
      toast({
        title: "Error", 
        description: "Jumlah penarikan melebihi saldo",
        variant: "destructive"
      });
      return;
    }

    // For now, just create a transaction record for withdrawal request
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          companion_id: user.id,
          amount: -amount, // Negative amount for withdrawal
          payment_method: 'bank_transfer',
          service: 'withdrawal_request',
          status: 'pending' as any,
          duration: 0
        });

      if (error) throw error;

      setWithdrawalAmount('');
      setBankAccount('');
      
      toast({
        title: "Pengajuan berhasil",
        description: "Pengajuan penarikan akan diproses dalam 1-3 hari kerja",
      });
      
      // Refresh data
      fetchTalentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengajukan penarikan",
        variant: "destructive"
      });
    }
  };

  // Show loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is a companion
  if (user.user_type !== 'companion') {
    console.log('TalentDashboard: Render access denied - user_type:', user.user_type);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only talents can access this dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Current user type: {user.user_type}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Gagal memuat data profil</p>
          <Button onClick={fetchTalentData} className="mt-4">Coba Lagi</Button>
        </div>
      </div>
    );
  }

  const getCommissionRate = () => {
    switch (profileData.level) {
      case 'VIP Talent': return 15;
      case 'Elite Talent': return 18;
      default: return 20;
    }
  };

  const availableBalance = profileData.total_earnings;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Talent Dashboard"
        subtitle={`Selamat datang kembali, ${profileData.name}!`}
        userType="companion"
        notificationCount={0}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Availability Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 bg-card rounded-lg border">
          <div>
            <h3 className="font-semibold">Status Ketersediaan</h3>
            <p className="text-sm text-muted-foreground">Aktifkan untuk menerima booking baru</p>

          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="availability">Tersedia untuk booking</Label>
              <Switch 
                id="availability"
                checked={profileData.is_available} 
                onCheckedChange={handleAvailabilityToggle} 
              />
            </div>
            <Badge variant={profileData.level === 'VIP Talent' ? 'default' : 'secondary'}>
              {profileData.level}
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {(profileData.total_earnings / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">Komisi: {getCommissionRate()}%</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Selesai</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileData.total_orders}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={recalculateRating}
                  className="h-6 w-6 p-0"
                  title="Recalculate rating from reviews"
                >
                  🔄
                </Button>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileData.rating}/5</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Tersedia</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {availableBalance.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="bookings">Booking</TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="gallery">Galeri</TabsTrigger>
            <TabsTrigger value="services">Layanan</TabsTrigger>
            <TabsTrigger value="earnings">Pendapatan</TabsTrigger>
            <TabsTrigger value="withdrawals">Penarikan</TabsTrigger>
            <TabsTrigger value="schedule">Jadwal</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Booking Terbaru</CardTitle>
                <Button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    dataFetchedRef.current = false; // Reset flag to allow fresh fetch
                    fetchTalentData();
                  }}
                  variant="outline"
                  size="sm"
                >
                  🔄 Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Layanan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id.slice(-8)}</TableCell>
                        <TableCell>{booking.user_name}</TableCell>
                        <TableCell className="capitalize">{booking.service_type.replace('_', ' ')}</TableCell>
                        <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                        <TableCell>Rp {booking.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === 'completed' ? 'default' :
                              booking.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Status Update Buttons */}
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}

                            {/* When booking is paid, show confirm option */}
                            {booking.status === 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm this booking?
                              </Button>
                            )}

                            {booking.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'in_progress')}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Complete
                                </Button>
                              </>
                            )}

                            {booking.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Complete
                              </Button>
                            )}


                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Tampilan</Label>
                    <Input 
                      id="name"
                      value={profileData.name} 
                      onChange={(e) => setProfileData(prev => prev ? {...prev, name: e.target.value} : null)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly-rate">Tarif Per Jam (Rp)</Label>
                    <Input 
                      id="hourly-rate"
                      type="number"
                      value={profileData.hourly_rate} 
                      onChange={(e) => setProfileData(prev => prev ? {...prev, hourly_rate: parseInt(e.target.value)} : null)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="zodiac">Zodiak</Label>
                    <Select value={profileData.zodiac} onValueChange={(value) => setProfileData(prev => prev ? {...prev, zodiac: value} : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aries">Aries</SelectItem>
                        <SelectItem value="Taurus">Taurus</SelectItem>
                        <SelectItem value="Gemini">Gemini</SelectItem>
                        <SelectItem value="Cancer">Cancer</SelectItem>
                        <SelectItem value="Leo">Leo</SelectItem>
                        <SelectItem value="Virgo">Virgo</SelectItem>
                        <SelectItem value="Libra">Libra</SelectItem>
                        <SelectItem value="Scorpio">Scorpio</SelectItem>
                        <SelectItem value="Sagittarius">Sagittarius</SelectItem>
                        <SelectItem value="Capricorn">Capricorn</SelectItem>
                        <SelectItem value="Aquarius">Aquarius</SelectItem>
                        <SelectItem value="Pisces">Pisces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="love-language">Love Language</Label>
                    <Select value={profileData.love_language} onValueChange={(value) => setProfileData(prev => prev ? {...prev, love_language: value} : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Quality Time">Quality Time</SelectItem>
                        <SelectItem value="Words of Affirmation">Words of Affirmation</SelectItem>
                        <SelectItem value="Physical Touch">Physical Touch</SelectItem>
                        <SelectItem value="Acts of Service">Acts of Service</SelectItem>
                        <SelectItem value="Receiving Gifts">Receiving Gifts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio"
                    value={profileData.bio} 
                    onChange={(e) => setProfileData(prev => prev ? {...prev, bio: e.target.value} : null)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minat</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {interests.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox 
                          id={interest}
                          checked={selectedInterests.includes(interest)}
                          onCheckedChange={() => handleInterestToggle(interest)}
                        />
                        <Label htmlFor={interest} className="text-sm">{interest}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveProfile}>
                  Simpan Profil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Galeri Foto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Kelola foto galeri Anda (maksimal 5 foto). Foto profil akan otomatis ditampilkan di galeri.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="p-3 bg-pink-100 rounded-full">
                          <Upload className="h-6 w-6 text-pink-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Upload Foto Baru</h3>
                        <p className="text-sm text-gray-500">
                          JPG, PNG hingga 5MB. Anda memiliki {galleryImages.length}/5 foto.
                        </p>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage || galleryImages.length >= 5}
                          className="hidden"
                          id="gallery-upload"
                        />
                        <label htmlFor="gallery-upload">
                          <Button
                            asChild
                            disabled={uploadingImage || galleryImages.length >= 5}
                            className="cursor-pointer"
                          >
                            <span>
                              {uploadingImage ? 'Mengunggah...' : 'Pilih Foto'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Grid */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Foto Galeri Anda</h3>
                    {galleryImages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Belum ada foto di galeri</p>
                        <p className="text-sm">Upload foto pertama Anda untuk menarik lebih banyak klien</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {galleryImages.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={image.image_url}
                                alt={image.caption || `Gallery photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1 truncate">
                                {image.caption || `Photo ${index + 1}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Profile Photo Info */}
                  {profileData?.profile_image && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">Foto Profil</h4>
                          <p className="text-sm text-blue-700">
                            Foto profil Anda akan otomatis ditampilkan sebagai foto pertama di galeri publik.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Layanan Tersedia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                        />
                        <div>
                          <Label className="font-medium">{service.name}</Label>
                          <p className="text-sm text-muted-foreground">Base: Rp {service.basePrice.toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedServices.includes(service.id) && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Aktif</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.created_at || '').toLocaleDateString()}</TableCell>
                          <TableCell className="capitalize">{transaction.service}</TableCell>
                          <TableCell>
                            {transaction.companion_earnings ? 
                              `Rp ${transaction.companion_earnings.toLocaleString()}` : 
                              `Rp ${transaction.amount.toLocaleString()}`
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="withdrawals">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pengajuan Penarikan Baru</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdrawal-amount">Jumlah Penarikan (Rp)</Label>
                      <Input 
                        id="withdrawal-amount"
                        type="number"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="Min. Rp 50.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-account">Rekening Bank</Label>
                      <Input 
                        id="bank-account"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="No. Rekening - Bank - Atas Nama"
                      />
                    </div>
                  </div>
                  <Button onClick={handleWithdrawalRequest} disabled={!withdrawalAmount || !bankAccount}>
                    Ajukan Penarikan
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Saldo tersedia: Rp {availableBalance.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Penarikan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Layanan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .filter(t => t.service === 'withdrawal_request')
                        .map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{new Date(withdrawal.created_at || '').toLocaleDateString()}</TableCell>
                          <TableCell>Rp {Math.abs(withdrawal.amount).toLocaleString()}</TableCell>
                          <TableCell>Penarikan Dana</TableCell>
                          <TableCell>
                            <Badge variant={withdrawal.status === 'paid' ? 'default' : 'secondary'}>
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Jadwal Ketersediaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Offline Date</h3>
                      <div className="space-y-2">
                        <Label>Hari Kerja</Label>
                        <div className="flex gap-2">
                          <Input type="time" defaultValue="17:00" />
                          <span className="self-center">hingga</span>
                          <Input type="time" defaultValue="22:00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Akhir Pekan</Label>
                        <div className="flex gap-2">
                          <Input type="time" defaultValue="10:00" />
                          <span className="self-center">hingga</span>
                          <Input type="time" defaultValue="23:00" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold">Party Buddy</h3>
                      <div className="space-y-2">
                        <Label>Malam Akhir Pekan</Label>
                        <div className="flex gap-2">
                          <Input type="time" defaultValue="20:00" />
                          <span className="self-center">hingga</span>
                          <Input type="time" defaultValue="04:00" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button>Simpan Jadwal</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TalentDashboard;