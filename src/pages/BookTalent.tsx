import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, MessageSquare, Star, User, Users, Video, Phone, Heart, Music, Coffee, Utensils, Film, Briefcase, Camera, Info, Zap, Eye, ThumbsUp, Clock, Award, Globe, BookOpen, Gamepad2, Palette, Dumbbell, Plane, ShoppingBag, Car, Home, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FavoritesService } from '@/services/favoritesService';
import MainHeader from '@/components/MainHeader';
import ChatButton from '@/components/chat/ChatButton';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { BookingService, CreateBookingData } from '@/services/bookingService';

// Define types for our data structures
interface Talent {
  id: string;
  name: string;
  full_name: string;
  age: number;
  location: string;
  city: string;
  bio: string;
  profile_image: string;
  talent_level: 'fresh' | 'elite' | 'vip';
  rating: number;
  zodiac?: string;
  love_language?: string;
  interests?: string[];
  available_services?: string[];
  is_available: boolean;
  total_orders: number;
  average_rating: number;
  party_buddy_eligible?: boolean;
  rent_lover_rate?: number;
  rent_lover_description?: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  type: string;
  base_rate: number;
  additional_rate?: number;
  unit: string;
  description: string;
  transport_percentage: number;
  icon: React.ReactNode;
}

interface BookingFormData {
  date: Date | null;
  time: string;
  duration: number;
  location: string;
  date_plan: string;
  date_location: string;
  notes: string;
  selected_services: Service[];
}

// Service icons mapping
const serviceIcons = {
  chat: <MessageSquare className="w-5 h-5" />,
  call: <Phone className="w-5 h-5" />,
  video_call: <Video className="w-5 h-5" />,
  offline_date: <MapPin className="w-5 h-5" />,
  party_buddy: <Users className="w-5 h-5" />,
  rent_lover: <Heart className="w-5 h-5" />
};

// Interest icons mapping
const interestIcons = {
  'Digital Marketing': <Globe className="w-3 h-3" />,
  'Content Creation': <Camera className="w-3 h-3" />,
  'Social Media Strategy': <Users className="w-3 h-3" />,
  'Brand Development': <Briefcase className="w-3 h-3" />,
  'Business Networking': <Users className="w-3 h-3" />,
  'Culinary Tours': <Utensils className="w-3 h-3" />,
  'Cooking Classes': <Coffee className="w-3 h-3" />,
  'Food Photography': <Camera className="w-3 h-3" />,
  'Wine Tasting': <Coffee className="w-3 h-3" />,
  'Farmers Markets': <ShoppingBag className="w-3 h-3" />,
  'Adventure Trips': <Plane className="w-3 h-3" />,
  'City Explorations': <MapPin className="w-3 h-3" />,
  'Travel Photography': <Camera className="w-3 h-3" />,
  'Cultural Tours': <Globe className="w-3 h-3" />,
  'Hiking Trails': <Dumbbell className="w-3 h-3" />,
  'Makeup Sessions': <Palette className="w-3 h-3" />,
  'Beauty Shopping': <ShoppingBag className="w-3 h-3" />,
  'Skincare Routines': <Sparkles className="w-3 h-3" />,
  'Beauty Workshops': <BookOpen className="w-3 h-3" />,
  'Photo Shoots': <Camera className="w-3 h-3" />,
  'Yoga Sessions': <Dumbbell className="w-3 h-3" />,
  'Meditation': <Heart className="w-3 h-3" />,
  'Wellness Workshops': <BookOpen className="w-3 h-3" />,
  'Spiritual Retreats': <Home className="w-3 h-3" />,
  'Nature Walks': <Plane className="w-3 h-3" />,
  'Sushi Date': <Utensils className="w-3 h-3" />,
  'Movie Date': <Film className="w-3 h-3" />,
  'Coffee Chat': <Coffee className="w-3 h-3" />,
  'Museum Date': <BookOpen className="w-3 h-3" />,
  'Gaming': <Gamepad2 className="w-3 h-3" />,
  'Music': <Music className="w-3 h-3" />,
  'Sports': <Dumbbell className="w-3 h-3" />,
  'Art': <Palette className="w-3 h-3" />,
  'Reading': <BookOpen className="w-3 h-3" />,
  'Travel': <Plane className="w-3 h-3" />,
  'Dining': <Utensils className="w-3 h-3" />,
  default: <Heart className="w-3 h-3" />
};

// Talent level colors
const talentLevelColors = {
  fresh: 'bg-green-100 text-green-800',
  elite: 'bg-blue-100 text-blue-800',
  vip: 'bg-purple-100 text-purple-800'
};

// Commission rates by talent level
const commissionRates = {
  fresh: 20,
  elite: 18,
  vip: 15
};

const BookTalent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    date: null,
    time: '',
    duration: 1,
    location: '',
    date_plan: '',
    date_location: '',
    notes: '',
    selected_services: []
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Debug selectedService changes
  useEffect(() => {
    console.log('🔄 Selected service changed:', selectedService);
  }, [selectedService]);

  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Load reviews and gallery data
  const loadReviewsAndGallery = async (talentId: string) => {
    try {
      console.log('🔍 Loading reviews and gallery for talent:', talentId);

      // Try to fetch real reviews from database first
      const { data: realReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviewer_id(name, profile_image),
          bookings(service_type, service_name, duration, date)
        `)
        .eq('reviewee_id', talentId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Try to fetch real gallery from database
      const { data: realGallery, error: galleryError } = await supabase
        .from('talent_gallery')
        .select('*')
        .eq('talent_id', talentId)
        .order('display_order', { ascending: true });

      // Use only real data from database
      const reviewsData = realReviews?.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user: {
          name: review.profiles?.name || 'Anonymous User',
          avatar: review.profiles?.profile_image
        },
        booking: {
          service_name: review.bookings?.service_name || 'Service',
          service_type: review.bookings?.service_type || 'chat',
          duration: review.bookings?.duration || 1
        },
        is_verified: review.is_verified
      })) || [];

      // Combine profile image with gallery images
      const galleryData = [];

      // Add profile image first if it exists
      if (talent?.profile_image) {
        galleryData.push({
          id: 'profile-image',
          image_url: talent.profile_image,
          caption: 'Profile Photo',
          is_featured: true,
          created_at: talent.created_at
        });
      }

      // Add gallery images
      if (realGallery && realGallery.length > 0) {
        realGallery.forEach(item => {
          // Don't duplicate profile image
          if (item.image_url !== talent?.profile_image) {
            galleryData.push({
              id: item.id,
              image_url: item.image_url,
              caption: item.caption || 'Photo',
              is_featured: item.is_featured || false,
              created_at: item.created_at
            });
          }
        });
      }

      console.log('✅ Loaded reviews:', reviewsData.length, 'items');
      console.log('✅ Loaded gallery:', galleryData.length, 'items');

      // Calculate average rating from reviews
      const averageRating = reviewsData.length > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : 0;

      setReviews(reviewsData);

      // Update talent rating with calculated average
      setTalent(prev => prev ? {
        ...prev,
        rating: averageRating,
        total_orders: reviewsData.length
      } : null);
      setGallery(galleryData);
    } catch (error) {
      console.error('Error loading reviews and gallery:', error);
    }
  };

  // Check authentication only when trying to book (removed early redirect)

  // Fetch talent data
  useEffect(() => {
    const fetchTalent = async () => {
      if (!id) return;

      try {
        setLoading(true);

        console.log('🔍 Fetching talent with ID:', id);

        // Fetch real talent data from Supabase database
        const { data: talentData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .eq('user_type', 'companion')
          .eq('status', 'active')
          .single();

        if (error) {
          console.error('❌ Error fetching talent:', error);

          // If not found in database, show fallback message
          if (error.code === 'PGRST116') {
            setError('Talent not found. This talent may not be available or has been removed.');
          } else {
            setError('Failed to load talent profile. Please try again.');
          }
          return;
        }

        if (!talentData) {
          setError('Talent not found or not available.');
          return;
        }

        console.log('✅ Talent data loaded:', talentData);

        // Transform database data to component format
        const transformedTalent = {
          id: talentData.id,
          name: talentData.name,
          full_name: talentData.full_name || talentData.name,
          age: talentData.age,
          location: talentData.location,
          city: talentData.city,
          bio: talentData.bio,
          profile_image: talentData.profile_image,
          talent_level: talentData.talent_level,
          rating: talentData.average_rating || talentData.rating || 0,
          zodiac: talentData.zodiac,
          love_language: talentData.love_language,
          interests: talentData.profile_data?.interests || [],
          available_services: talentData.profile_data?.available_services || [],
          is_available: talentData.is_available,
          total_orders: talentData.total_bookings || 0,
          average_rating: talentData.average_rating || talentData.rating || 0,
          party_buddy_eligible: talentData.party_buddy_eligible,
          rent_lover_rate: talentData.profile_data?.rent_lover_rate || talentData.hourly_rate,
          rent_lover_description: talentData.profile_data?.rent_lover_includes || 'Professional companion services',
          created_at: talentData.created_at
        };

        setTalent(transformedTalent);

        // Build services based on talent's available services and rates
        const availableServices = talentData.profile_data?.available_services || [];
        console.log('🔍 Available services for talent:', availableServices);
        const servicesList: Service[] = [];

        if (availableServices.includes('chat')) {
          servicesList.push({
            id: 'chat',
            name: 'Chat',
            type: 'chat',
            base_rate: 25000,
            unit: 'hari',
            description: 'Layanan chat selama satu hari penuh',
            transport_percentage: 0,
            icon: serviceIcons.chat
          });
        }

        if (availableServices.includes('call')) {
          servicesList.push({
            id: 'call',
            name: 'Call',
            type: 'call',
            base_rate: 40000,
            additional_rate: 40000,
            unit: 'jam',
            description: 'Panggilan suara per jam',
            transport_percentage: 0,
            icon: serviceIcons.call
          });
        }

        if (availableServices.includes('video_call')) {
          servicesList.push({
            id: 'video_call',
            name: 'Video Call',
            type: 'video_call',
            base_rate: 60000,
            additional_rate: 60000,
            unit: 'jam',
            description: 'Video call per jam',
            transport_percentage: 0,
            icon: serviceIcons.video_call
          });
        }

        if (availableServices.includes('offline_date')) {
          servicesList.push({
            id: 'offline_date',
            name: 'Offline Date',
            type: 'offline_date',
            base_rate: 150000,
            additional_rate: 150000,
            unit: 'jam',
            description: 'Kencan offline per jam',
            transport_percentage: 20,
            icon: serviceIcons.offline_date
          });
        }

        if (availableServices.includes('party_buddy') && talentData.party_buddy_eligible) {
          servicesList.push({
            id: 'party_buddy',
            name: 'Party Buddy',
            type: 'party_buddy',
            base_rate: talentData.profile_data?.party_buddy_rate || 1000000,
            unit: 'event',
            description: 'Teman pesta untuk acara khusus',
            transport_percentage: 30,
            icon: serviceIcons.party_buddy
          });
        }

        if (availableServices.includes('rent_lover')) {
          servicesList.push({
            id: 'rent_lover',
            name: 'Rent a Lover',
            type: 'rent_lover',
            base_rate: talentData.profile_data?.rent_lover_rate || talentData.hourly_rate || 500000,
            unit: 'hari',
            description: talentData.profile_data?.rent_lover_includes || 'Layanan companion premium',
            transport_percentage: 25,
            icon: serviceIcons.rent_lover
          });
        }

        // If no services were added, add default services for testing
        if (servicesList.length === 0) {
          console.log('⚠️ No services found in talent data, adding default services');
          servicesList.push(
            {
              id: 'chat',
              name: 'Chat',
              type: 'chat',
              base_rate: 25000,
              unit: 'hari',
              description: 'Layanan chat selama satu hari penuh',
              transport_percentage: 0,
              icon: serviceIcons.chat
            },
            {
              id: 'call',
              name: 'Call',
              type: 'call',
              base_rate: 40000,
              additional_rate: 40000,
              unit: 'jam',
              description: 'Panggilan suara per jam',
              transport_percentage: 0,
              icon: serviceIcons.call
            },
            {
              id: 'video_call',
              name: 'Video Call',
              type: 'video_call',
              base_rate: 60000,
              additional_rate: 60000,
              unit: 'jam',
              description: 'Video call per jam',
              transport_percentage: 0,
              icon: serviceIcons.video_call
            },
            {
              id: 'offline_date',
              name: 'Offline Date',
              type: 'offline_date',
              base_rate: 150000,
              additional_rate: 150000,
              unit: 'jam',
              description: 'Kencan offline per jam',
              transport_percentage: 20,
              icon: serviceIcons.offline_date
            }
          );
        }

        console.log('✅ Final services list:', servicesList);
        setServices(servicesList);

        // Set user as verified if logged in
        if (user) {
          setIsVerified(true);
        }

        // Load reviews and gallery data
        await loadReviewsAndGallery(id);

      } catch (error) {
        console.error('Error fetching talent data:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data talent. Silakan coba lagi.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, [id, user, toast]);

  // Check favorite status when user and talent are loaded
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && talent?.id) {
        try {
          const isFavorited = await FavoritesService.isTalentFavorited(user.id, talent.id);
          setIsFavorited(isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, talent?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat informasi talent...</p>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Talent Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">Talent yang Anda cari tidak ada atau tidak tersedia.</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MainHeader />

      {/* Hero Section with Cover Photo */}
      <div className="relative h-80 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="absolute bottom-6 left-6 text-white">
          <div className="flex items-end gap-6">
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
              <AvatarImage src={talent.profile_image} alt={talent.name} />
              <AvatarFallback className="text-4xl bg-white text-gray-800">
                {talent.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{talent.name}</h1>
                <Badge className={cn('text-sm', talentLevelColors[talent.talent_level])}>
                  {talent.talent_level === 'fresh' ? 'Fresh Talent' :
                   talent.talent_level === 'elite' ? 'Elite Talent' :
                   talent.talent_level === 'vip' ? 'VIP Talent' :
                   'Fresh Talent'}
                </Badge>
              </div>
              <p className="text-xl opacity-90">{talent.age} years old • {talent.city}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{talent.rating.toFixed(1)}</span>
                  <span className="opacity-75">({talent.total_orders} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    talent.is_available ? "bg-green-400" : "bg-red-400"
                  )} />
                  <span className="font-medium">
                    {talent.is_available ? "Available Now" : "Busy"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3"
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Login Required",
                          description: "You need to login to book a service.",
                          variant: "destructive"
                        });
                        return;
                      }
                      setActiveTab('services');
                      toast({
                        title: "Ready to Book!",
                        description: `Let's book a service with ${talent.name}. Choose your preferred service below.`,
                      });
                    }}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Book Now
                  </Button>
                  <ChatButton
                    talentId={id}
                    onChatStart={(conversationId) => {
                      if (conversationId) {
                        navigate(`/chat/${conversationId}`);
                      } else {
                        navigate(`/chat?talentId=${id}`);
                      }
                    }}
                    variant="outline"
                    className="w-full border-2 border-blue-200 hover:bg-blue-50 font-semibold py-3"
                  />
                  <Button
                    variant="outline"
                    className={`w-full border-2 font-semibold py-3 ${
                      isFavorited
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-pink-200 hover:bg-pink-50'
                    }`}
                    onClick={async () => {
                      if (!user) {
                        toast({
                          title: "Login Required",
                          description: "You need to login to add talents to favorites.",
                          variant: "destructive"
                        });
                        return;
                      }

                      if (!talent) return;

                      setIsLoadingFavorite(true);
                      try {
                        const newFavoriteStatus = await FavoritesService.toggleFavorite(user.id, talent.id);
                        setIsFavorited(newFavoriteStatus);

                        toast({
                          title: newFavoriteStatus ? "Added to Favorites!" : "Removed from Favorites!",
                          description: newFavoriteStatus
                            ? `${talent.name} has been added to your favorites list.`
                            : `${talent.name} has been removed from your favorites list.`,
                        });
                      } catch (error) {
                        console.error('Error toggling favorite:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update favorites. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsLoadingFavorite(false);
                      }
                    }}
                    disabled={isLoadingFavorite}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${
                      isFavorited ? 'fill-current' : ''
                    } ${isLoadingFavorite ? 'animate-pulse' : ''}`} />
                    {isLoadingFavorite
                      ? 'Processing...'
                      : isFavorited
                        ? 'Remove from Favorites'
                        : 'Add to Favorites'
                    }
                  </Button>

                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-pink-500" />
                  About {talent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed break-words overflow-hidden">{talent.bio}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Response Time</p>
                    <p className="font-semibold">&lt; 15 minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Languages</p>
                    <p className="font-semibold">Indonesian, English</p>
                  </div>
                  {talent.zodiac && (
                    <div>
                      <p className="text-sm text-gray-500">Zodiac</p>
                      <p className="font-semibold">{talent.zodiac}</p>
                    </div>
                  )}
                  {talent.love_language && (
                    <div>
                      <p className="text-sm text-gray-500">Love Language</p>
                      <p className="font-semibold">{talent.love_language}</p>
                    </div>
                  )}
                </div>

                {/* Interests */}
                {talent.interests && talent.interests.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-3">Interests & Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {talent.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="gallery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Services & Pricing</CardTitle>
                    <CardDescription>Professional services offered by {talent.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <p>No services available for this talent.</p>
                        </div>
                      ) : (
                        services.map((service) => (
                        <div
                          key={service.id}
                          className="p-4 border-2 border-gray-100 hover:border-pink-200 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => {
                            if (!user) {
                              toast({
                                title: "Login Required",
                                description: "You need to login to book a service.",
                                variant: "destructive"
                              });
                              return;
                            }

                            console.log('🚀 Service selected from Overview tab, redirecting to booking page:', service);
                            // Navigate directly to booking page with service pre-selected
                            navigate(`/booking?talent=${talent.id}&name=${encodeURIComponent(talent.name)}&service=${service.id}&serviceName=${encodeURIComponent(service.name)}`);
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 group-hover:from-pink-200 group-hover:to-purple-200 transition-colors">
                                {service.icon}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                <p className="text-sm text-gray-600">{service.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                              Rp {service.base_rate.toLocaleString('id-ID')}
                            </span>
                            <span className="text-sm text-gray-500">/{service.unit}</span>
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-pink-500" />
                      Photo Gallery
                    </CardTitle>
                    <CardDescription>Professional photos and moments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {gallery.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setShowImageModal(true);
                          }}
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {photo.is_featured && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          Reviews & Ratings
                        </CardTitle>
                        <CardDescription>
                          {talent.rating > 0 ? `${talent.rating.toFixed(1)} out of 5 stars` : 'No rating yet'} ({talent.total_orders || 0} reviews)
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">{talent.rating > 0 ? talent.rating.toFixed(1) : 'No Rating'}</div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= Math.floor(talent.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Rating Breakdown */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3">Rating Breakdown</h4>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviews.filter(review => review.rating === rating).length;
                          const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <span className="text-sm w-8">{rating}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review Filters */}
                    <div className="flex gap-2 mb-6">
                      <Button
                        variant={reviewFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewFilter('all')}
                      >
                        All Reviews
                      </Button>
                      <Button
                        variant={reviewFilter === 'recent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewFilter('recent')}
                      >
                        Most Recent
                      </Button>
                      <Button
                        variant={reviewFilter === 'helpful' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewFilter('helpful')}
                      >
                        Most Helpful
                      </Button>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-6">
                      {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={review.user.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100">
                                {review.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="font-semibold">{review.user.name}</h5>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{review.booking.service_name}</span>
                                    <span>•</span>
                                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                    {review.is_verified && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                          Verified
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        "h-4 w-4",
                                        star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <button
                                  className="flex items-center gap-1 hover:text-gray-700"
                                  onClick={() => {
                                    toast({
                                      title: "Thank you!",
                                      description: "Your feedback has been recorded.",
                                    });
                                  }}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  Helpful (12)
                                </button>
                                <button
                                  className="hover:text-gray-700"
                                  onClick={() => {
                                    if (!user) {
                                      toast({
                                        title: "Login Required",
                                        description: "You need to login to reply to reviews.",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    toast({
                                      title: "Reply Feature",
                                      description: "Reply functionality coming soon!",
                                    });
                                  }}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {reviews.length > 3 && (
                      <div className="text-center pt-6">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllReviews(!showAllReviews)}
                        >
                          {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


            </Tabs>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {gallery.length > 0 && (
              <img
                src={gallery[selectedImageIndex]?.image_url}
                alt={gallery[selectedImageIndex]?.caption}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
            {gallery.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : gallery.length - 1)}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setSelectedImageIndex(selectedImageIndex < gallery.length - 1 ? selectedImageIndex + 1 : 0)}
                >
                  →
                </Button>
              </>
            )}
          </div>
          <div className="p-6 pt-4">
            <p className="text-gray-600">{gallery[selectedImageIndex]?.caption}</p>
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {gallery.map((photo, index) => (
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={photo.caption}
                  className={cn(
                    "w-16 h-16 object-cover rounded cursor-pointer border-2",
                    index === selectedImageIndex ? "border-pink-500" : "border-gray-200"
                  )}
                  onClick={() => setSelectedImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BookTalent;
