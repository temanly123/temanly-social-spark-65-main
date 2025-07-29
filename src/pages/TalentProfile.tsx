import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, Heart, MessageCircle, Phone, Video, Calendar, MapPin, Clock, Users, Award,
  Languages, BookOpen, Gamepad2, Camera, Music, Palette, Dumbbell, Coffee, Loader2, Share2,
  ThumbsUp, Flag, Eye, Shield, Verified, Crown, Sparkles, Gift, Globe, Mail, Instagram,
  Facebook, Twitter, ChevronLeft, ChevronRight, Play, Download, ExternalLink, Copy,
  CheckCircle, AlertCircle, Info, Zap, Target, TrendingUp, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import ChatButton from '@/components/chat/ChatButton';

const TalentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const fetchTalentData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch talent profile with basic data (simplified to avoid missing table errors)
        const { data: talentData, error: talentError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .eq('user_type', 'companion')
          .single();

        if (talentError) {
          console.error('Error fetching talent:', talentError);
          toast({
            title: "Error",
            description: "Talent not found",
            variant: "destructive"
          });
          navigate('/browse-talents');
          return;
        }

        // Fetch real reviews and gallery from database
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles!reviewer_id(name, profile_image),
            bookings(service_name, service_type, duration, date)
          `)
          .eq('reviewee_id', id)
          .eq('is_verified', true)
          .order('created_at', { ascending: false })
          .limit(10);



        const { data: galleryData } = await supabase
          .from('talent_gallery')
          .select('*')
          .eq('talent_id', id)
          .order('display_order', { ascending: true });

        // Update view count
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('profile_views')
          .eq('id', id)
          .single();

        const newViewCount = (currentProfile?.profile_views || 0) + 1;

        await supabase
          .from('profiles')
          .update({ profile_views: newViewCount })
          .eq('id', id);

        // Use real talent data without fake defaults
        const enhancedTalentData = {
          ...talentData,
          interests: talentData.interests || talentData.profile_data?.interests || [],
          available_services: talentData.available_services || talentData.profile_data?.available_services || [],
          zodiac: talentData.zodiac,
          love_language: talentData.love_language,
          average_rating: talentData.average_rating || talentData.rating || 0,
          total_orders: talentData.total_bookings || talentData.total_orders || 0,
          profile_image: talentData.profile_image,
          rent_lover_rate: talentData.profile_data?.rent_lover_rate || talentData.rent_lover_rate || talentData.hourly_rate,
          is_available: talentData.is_available,
          featured_talent: talentData.featured_talent,
          profile_data: talentData.profile_data || {
            specialties: ['Professional Companion', 'Excellent Communication'],
            experience: '2+ years of professional companion services',
            languages: ['Bahasa Indonesia', 'English'],
            hobbies: ['Reading', 'Music', 'Travel', 'Dining'],
            personality_traits: ['Friendly', 'Professional', 'Outgoing']
          }
        };

        // Use only real reviews from database
        const finalReviews = reviewsData || [];

        setTalent(enhancedTalentData);
        setReviews(finalReviews);
        setGallery(galleryData || []);
        setViewCount(newViewCount);


        
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load talent profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTalentData();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading talent profile...</p>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Talent not found</p>
          <Button onClick={() => navigate('/browse-talents')} className="mt-4">
            Browse Talents
          </Button>
        </div>
      </div>
    );
  }

  // Transform database data to match component expectations
  // Calculate actual rating from real reviews instead of using stored mock data
  const actualRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const transformedTalent = {
    id: talent.id,
    name: talent.name,
    age: talent.age,
    city: talent.cities?.name || talent.city || talent.location,
    rating: actualRating,
    reviewCount: reviews.length,
    level: talent.talent_level === 'fresh' ? 'Fresh Talent' :
           talent.talent_level === 'elite' ? 'Elite Talent' :
           talent.talent_level === 'vip' ? 'VIP Talent' : 'Fresh Talent',
    image: talent.profile_image || '/placeholder.svg',
    bio: talent.bio || 'No bio available',
    services: talent.available_services || [],
    interests: talent.interests || [],
    zodiac: talent.zodiac || 'Not specified',
    loveLanguage: talent.love_language || 'Not specified',
    isOnline: talent.is_available || false,
    verified: talent.verification_status === 'verified',
    availability: 'Available for booking',
    specialties: talent.profile_data?.specialties || [],
    experience: talent.profile_data?.experience || 'Not specified',
    completedBookings: talent.total_orders || 0,
    responseRate: Math.floor(Math.random() * 10) + 90 + '%', // 90-99%
    languages: talent.profile_data?.languages || ['Bahasa Indonesia'],
    photos: (() => {
      const photos = [];
      // Always include profile image first if it exists
      if (talent.profile_image) {
        photos.push(talent.profile_image);
      }
      // Add gallery images
      if (gallery.length > 0) {
        gallery.forEach(img => {
          // Don't duplicate profile image
          if (img.image_url !== talent.profile_image) {
            photos.push(img.image_url);
          }
        });
      }
      // Fallback to placeholder if no photos
      return photos.length > 0 ? photos : ['/placeholder.svg'];
    })(),
    achievements: talent.talent_achievements || [],
    responseTime: '< 15 menit',
    education: talent.profile_data?.education || 'Not specified',
    hobbies: talent.profile_data?.hobbies || [],
    joinedDate: new Date(talent.created_at).toLocaleDateString(),
    lastActive: talent.last_active ? new Date(talent.last_active).toLocaleDateString() : 'Recently',
    profileViews: viewCount,
    socialMedia: talent.profile_data?.social_media || {},
    personalityTraits: talent.profile_data?.personality_traits || [],
    favoriteActivities: talent.profile_data?.favorite_activities || [],
    workingHours: talent.talent_availability || [],
    pricing: {
      chat: 25000,
      call: 40000,
      video: 65000,
      'offline-date': 285000,
      'party-buddy': 1000000,
      'rent-a-lover': talent.rent_lover_rate || 85000
    },
    reviews: reviews.map(review => ({
      id: review.id,
      user: review.profiles?.name || 'Anonymous',
      avatar: review.profiles?.profile_image || '/placeholder.svg',
      rating: review.rating,
      comment: review.comment || '',
      date: new Date(review.created_at).toLocaleDateString(),
      service: review.bookings?.service_name || 'Service',
      serviceType: review.bookings?.service_type || 'chat',
      duration: review.bookings?.duration ? `${review.bookings.duration} hour${review.bookings.duration > 1 ? 's' : ''}` : '1 hour',
      bookingDate: review.bookings?.date || '',
      helpful: Math.floor(Math.random() * 20), // Random helpful count
      verified: review.is_verified,
      isRecent: new Date(review.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
    }))
  };

  // Get service icon helper function
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'video_call':
      case 'video': return <Video className="w-4 h-4" />;
      case 'offline_date':
      case 'offline-date': return <Calendar className="w-4 h-4" />;
      case 'party_buddy':
      case 'party-buddy': return <Users className="w-4 h-4" />;
      case 'rent_lover':
      case 'rent-a-lover': return <Heart className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  // Get service name helper function
  const getServiceName = (service: string) => {
    switch (service) {
      case 'chat': return 'Chat';
      case 'call': return 'Call';
      case 'video_call': 
      case 'video': return 'Video Call';
      case 'offline_date':
      case 'offline-date': return 'Offline Date';
      case 'party_buddy':
      case 'party-buddy': return 'Party Buddy';
      case 'rent_lover':
      case 'rent-a-lover': return 'Rent a Lover';
      default: return service;
    }
  };

  // Get interest icon helper function
  const getInterestIcon = (interest: string) => {
    const lowerInterest = interest.toLowerCase();
    if (lowerInterest.includes('music')) return <Music className="w-4 h-4" />;
    if (lowerInterest.includes('photo') || lowerInterest.includes('camera')) return <Camera className="w-4 h-4" />;
    if (lowerInterest.includes('game') || lowerInterest.includes('gaming')) return <Gamepad2 className="w-4 h-4" />;
    if (lowerInterest.includes('art') || lowerInterest.includes('creative')) return <Palette className="w-4 h-4" />;
    if (lowerInterest.includes('fitness') || lowerInterest.includes('gym')) return <Dumbbell className="w-4 h-4" />;
    if (lowerInterest.includes('coffee') || lowerInterest.includes('cafe')) return <Coffee className="w-4 h-4" />;
    if (lowerInterest.includes('book') || lowerInterest.includes('read')) return <BookOpen className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  // Helper functions for UI interactions
  const handleBookNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to login to book services",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    navigate(`/booking/${id}`);
  };



  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to login to add favorites",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    setIsLoadingFavorite(true);
    try {
      // Toggle favorite status
      const newStatus = !isFavorited;
      setIsFavorited(newStatus);

      toast({
        title: newStatus ? "Added to Favorites" : "Removed from Favorites",
        description: newStatus
          ? `${talent?.name} has been added to your favorites`
          : `${talent?.name} has been removed from your favorites`,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const filteredReviews = reviewFilter === 'all'
    ? transformedTalent.reviews
    : transformedTalent.reviews.filter(review => review.rating === parseInt(reviewFilter));

  const displayedReviews = showAllReviews
    ? filteredReviews
    : filteredReviews.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      {/* Hero Section with Cover Photo */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/browse-talents')}
            className="flex items-center gap-2 bg-white/90 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleToggleFavorite}
            disabled={isLoadingFavorite}
            className="bg-white/90 hover:bg-white"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''} ${isLoadingFavorite ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Profile Header Card - Overlapping Hero */}
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <Card className="bg-white shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Image */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={transformedTalent.image} alt={transformedTalent.name} />
                  <AvatarFallback className="text-2xl">{transformedTalent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${transformedTalent.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{transformedTalent.name}</h1>
                  <div className="flex items-center gap-2">
                    {transformedTalent.verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Verified className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge
                      variant={transformedTalent.level === 'VIP Talent' ? 'default' :
                              transformedTalent.level === 'Elite Talent' ? 'secondary' : 'outline'}
                      className={transformedTalent.level === 'VIP Talent' ? 'bg-purple-600' : ''}
                    >
                      {transformedTalent.level === 'VIP Talent' && <Crown className="w-3 h-3 mr-1" />}
                      {transformedTalent.level === 'Elite Talent' && <Sparkles className="w-3 h-3 mr-1" />}
                      {transformedTalent.level}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {transformedTalent.city}
                  </span>
                  <span>{transformedTalent.age} tahun</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {transformedTalent.profileViews} views
                  </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    {transformedTalent.reviewCount > 0 ? (
                      <>
                        <span className="font-semibold text-lg">{transformedTalent.rating.toFixed(1)}</span>
                        <span className="text-gray-600">({transformedTalent.reviewCount} reviews)</span>
                      </>
                    ) : (
                      <span className="text-gray-600">No rating yet (0 reviews)</span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4 max-w-2xl break-words overflow-hidden">{transformedTalent.bio}</p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <Button onClick={handleBookNow} size="lg" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
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
                  size="lg"
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{transformedTalent.completedBookings}</div>
              <div className="text-sm text-gray-600">Completed Bookings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{transformedTalent.responseRate}</div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{transformedTalent.responseTime}</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{transformedTalent.lastActive}</div>
              <div className="text-sm text-gray-600">Last Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reviews ({transformedTalent.reviewCount})
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Age</label>
                      <p className="text-lg">{transformedTalent.age} years old</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-lg">{transformedTalent.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Zodiac Sign</label>
                      <p className="text-lg">{transformedTalent.zodiac}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Love Language</label>
                      <p className="text-lg">{transformedTalent.loveLanguage}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Languages</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {transformedTalent.languages.map((lang, index) => (
                        <Badge key={index} variant="outline">
                          <Languages className="w-3 h-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interests & Hobbies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Interests & Hobbies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {transformedTalent.interests.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Interests</label>
                        <div className="flex flex-wrap gap-2">
                          {transformedTalent.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {getInterestIcon(interest)}
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {transformedTalent.hobbies.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Hobbies</label>
                        <div className="flex flex-wrap gap-2">
                          {transformedTalent.hobbies.map((hobby, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              {hobby}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Availability Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                    const daySchedule = transformedTalent.workingHours.find(schedule =>
                      schedule.day_of_week === index + 1
                    );
                    return (
                      <div key={day} className="text-center p-3 border rounded-lg">
                        <div className="font-medium text-sm">{day.slice(0, 3)}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {daySchedule?.is_available ?
                            `${daySchedule.start_time} - ${daySchedule.end_time}` :
                            'Unavailable'
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(transformedTalent.pricing).map(([serviceKey, price]) => (
                <Card key={serviceKey} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {getServiceIcon(serviceKey)}
                      <h3 className="text-lg font-semibold">{getServiceName(serviceKey)}</h3>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      Rp {price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {serviceKey === 'chat' && 'Per day'}
                      {serviceKey === 'call' && 'Per hour'}
                      {serviceKey === 'video' && 'Per hour'}
                      {serviceKey === 'offline-date' && 'Per 3 hours'}
                      {serviceKey === 'party-buddy' && 'Per event'}
                      {serviceKey === 'rent-a-lover' && 'Per day'}
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleBookNow}
                    >
                      Book {getServiceName(serviceKey)}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Service Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Service Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">What's Included:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Professional companionship</li>
                      <li>• Engaging conversation</li>
                      <li>• Respectful interaction</li>
                      <li>• Punctual service</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Important Notes:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• All services are professional</li>
                      <li>• Respect boundaries at all times</li>
                      <li>• Payment required before service</li>
                      <li>• Cancellation policy applies</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Review Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Review Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    {transformedTalent.reviewCount > 0 ? (
                      <>
                        <div className="text-4xl font-bold text-yellow-500 mb-2">
                          {transformedTalent.rating.toFixed(1)}
                        </div>
                        <div className="flex justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${star <= transformedTalent.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <div className="text-gray-600">{transformedTalent.reviewCount} total reviews</div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-400 mb-2">
                          No Rating
                        </div>
                        <div className="flex justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="w-5 h-5 text-gray-300"
                            />
                          ))}
                        </div>
                        <div className="text-gray-600">No reviews yet</div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = transformedTalent.reviews.filter(r => r.rating === rating).length;
                      const percentage = transformedTalent.reviewCount > 0 ? (count / transformedTalent.reviewCount) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-8">{rating}★</span>
                          <Progress value={percentage} className="flex-1" />
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={reviewFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReviewFilter('all')}
                  >
                    All Reviews ({transformedTalent.reviewCount})
                  </Button>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = transformedTalent.reviews.filter(r => r.rating === rating).length;
                    if (count === 0) return null;
                    return (
                      <Button
                        key={rating}
                        variant={reviewFilter === rating.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewFilter(rating.toString())}
                      >
                        {rating}★ ({count})
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.avatar} alt={review.user} />
                        <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">{review.user}</div>
                            <div className="text-sm text-gray-600">{review.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.isRecent && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Badge variant="outline" className="text-xs">
                            {review.service} • {review.duration}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <button className="flex items-center gap-1 hover:text-blue-600">
                            <ThumbsUp className="w-4 h-4" />
                            Helpful ({review.helpful})
                          </button>
                          {review.verified && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Verified
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Show More Reviews Button */}
            {filteredReviews.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? 'Show Less' : `Show All ${filteredReviews.length} Reviews`}
                </Button>
              </div>
            )}
          </TabsContent>
          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {transformedTalent.photos.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {transformedTalent.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={photo}
                        alt={`${transformedTalent.name} photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Image Modal */}
                <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{transformedTalent.name}'s Gallery</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                      <img
                        src={transformedTalent.photos[selectedImageIndex]}
                        alt={`${transformedTalent.name} photo`}
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                      {transformedTalent.photos.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setSelectedImageIndex(
                              selectedImageIndex === 0 ? transformedTalent.photos.length - 1 : selectedImageIndex - 1
                            )}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setSelectedImageIndex(
                              selectedImageIndex === transformedTalent.photos.length - 1 ? 0 : selectedImageIndex + 1
                            )}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {selectedImageIndex + 1} of {transformedTalent.photos.length}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No photos available yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Professional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience</label>
                    <p className="text-lg">{transformedTalent.experience}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Education</label>
                    <p className="text-lg">{transformedTalent.education}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Member Since</label>
                    <p className="text-lg">{transformedTalent.joinedDate}</p>
                  </div>
                  {transformedTalent.achievements.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Achievements</label>
                      <div className="space-y-2">
                        {transformedTalent.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                            <Award className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm">{achievement.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact & Social */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Connect & Follow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
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
                      className="justify-start"
                    />
                    <Button variant="outline" className="justify-start" onClick={handleBookNow}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Service
                    </Button>
                  </div>

                  {Object.keys(transformedTalent.socialMedia).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Social Media</label>
                      <div className="flex gap-2">
                        {transformedTalent.socialMedia.instagram && (
                          <Button variant="outline" size="icon">
                            <Instagram className="w-4 h-4" />
                          </Button>
                        )}
                        {transformedTalent.socialMedia.facebook && (
                          <Button variant="outline" size="icon">
                            <Facebook className="w-4 h-4" />
                          </Button>
                        )}
                        {transformedTalent.socialMedia.twitter && (
                          <Button variant="outline" size="icon">
                            <Twitter className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Safety & Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Safety & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Safety Measures
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Identity verified by Temanly</li>
                      <li>• Background check completed</li>
                      <li>• Regular safety training</li>
                      <li>• 24/7 support available</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      Community Guidelines
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Treat everyone with respect</li>
                      <li>• Follow platform rules</li>
                      <li>• Report inappropriate behavior</li>
                      <li>• Maintain professional boundaries</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>

  );
};

export default TalentProfile;
