import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Phone, Video, Star, MapPin, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FavoritesService } from '@/services/favoritesService';

interface Talent {
  id: string; // Changed to string to match BookTalent page
  name: string;
  age: number;
  city: string;
  rating: number;
  reviewCount: number;
  level: string;
  image: string;
  services: string[];
  interests: string[];
  zodiac: string;
  loveLanguage: string;
  description: string;
  priceRange: string;
  isOnline: boolean;
  verified: boolean;
  availability: string;
}

interface TalentCardProps {
  talent: Talent;
  isNewcomer?: boolean;
}

const TalentCard: React.FC<TalentCardProps> = ({ talent, isNewcomer = false }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Check if talent is favorited on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && talent.id) {
        try {
          const isFavorited = await FavoritesService.isTalentFavorited(user.id, talent.id);
          setIsBookmarked(isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, talent.id]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔄 [TalentCard] Bookmark clicked for talent:', talent.name, 'ID:', talent.id);
    console.log('🔄 [TalentCard] User:', user?.id, 'Authenticated:', isAuthenticated);

    if (!isAuthenticated || !user) {
      console.log('❌ [TalentCard] User not authenticated');
      toast({
        title: "Login Required",
        description: "Silakan login untuk menambahkan talent ke favorites.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingFavorite(true);

    try {
      console.log('🔄 [TalentCard] Calling toggleFavorite with:', { userId: user.id, talentId: talent.id });
      const newFavoriteStatus = await FavoritesService.toggleFavorite(user.id, talent.id);
      console.log('✅ [TalentCard] Toggle result:', newFavoriteStatus);

      setIsBookmarked(newFavoriteStatus);

      toast({
        title: newFavoriteStatus ? "Added to Favorites" : "Removed from Favorites",
        description: newFavoriteStatus
          ? `${talent.name} telah ditambahkan ke favorites Anda.`
          : `${talent.name} telah dihapus dari favorites Anda.`,
      });
    } catch (error) {
      console.error('❌ [TalentCard] Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate favorites. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  };



  const getLevelColor = (level: string) => {
    switch (level) {
      case 'VIP Talent': return 'bg-purple-100 text-purple-700';
      case 'Elite Talent': return 'bg-blue-100 text-blue-700';
      case 'Fresh Talent': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'video_call': return <Video className="w-4 h-4" />;
      case 'offline_date': return <Heart className="w-4 h-4" />;
      case 'party_buddy': return <Users className="w-4 h-4" />;
      case 'rent_lover': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  const getServiceDisplayName = (service: string) => {
    switch (service) {
      case 'chat': return 'Chat';
      case 'call': return 'Call';
      case 'video_call': return 'Video Call';
      case 'offline_date': return 'Offline Date';
      case 'party_buddy': return 'Party Buddy';
      case 'rent_lover': return 'Rent a Lover';
      default: return service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border-0">
      <div className="relative">
        <img 
          src={talent.image} 
          alt={talent.name}
          className="w-full h-64 object-cover"
        />
        
        {/* Online Status */}
        <div className="absolute top-4 left-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            talent.isOnline ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full ${talent.isOnline ? 'bg-white' : 'bg-gray-300'}`} />
            {talent.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Newcomer Badge */}
        {isNewcomer && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-yellow-500 text-white border-0">
              🌟 New
            </Badge>
          </div>
        )}

        {/* Favorite Button */}
        <div className="absolute top-4 right-4">
          <Button
            size="icon"
            variant="ghost"
            className={`bg-black/20 hover:bg-black/40 rounded-full ${
              isBookmarked ? 'text-red-500' : 'text-white'
            }`}
            onClick={handleBookmark}
            disabled={isLoadingFavorite}
          >
            <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''} ${
              isLoadingFavorite ? 'animate-pulse' : ''
            }`} />
          </Button>
        </div>

        {/* Verified Badge */}
        {talent.verified && (
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-blue-500 text-white border-0 text-xs">
              ✓ Verified
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{talent.name}, {talent.age}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{talent.city}</span>
              <span>•</span>
              <span>{talent.zodiac}</span>
            </div>
          </div>
          <Badge className={`${getLevelColor(talent.level)} border-0 text-xs`}>
            {talent.level}
          </Badge>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">
              {talent.rating > 0 ? talent.rating.toFixed(1) : 'New'}
            </span>
          </div>
          {talent.reviewCount > 0 && (
            <span className="text-sm text-gray-500">({talent.reviewCount} reviews)</span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3">{talent.description}</p>

        {/* Services */}
        <div className="flex flex-wrap gap-2 mb-3">
          {talent.services.slice(0, 4).map((service) => (
            <Badge key={service} variant="outline" className="text-xs flex items-center gap-1">
              {getServiceIcon(service)}
              {getServiceDisplayName(service)}
            </Badge>
          ))}
          {talent.services.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{talent.services.length - 4} more
            </Badge>
          )}
        </div>

        {/* Interests */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Interests:</p>
          <div className="flex flex-wrap gap-1">
            {talent.interests.slice(0, 3).map((interest) => (
              <span key={interest} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{talent.availability}</span>
        </div>

        {/* Price and Book Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mulai dari</p>
            <p className="font-bold text-lg text-gray-900">{talent.priceRange}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/book-talent/${talent.id}`}>
              <Button className="bg-pink-500 text-white hover:bg-pink-600 rounded-lg" size="sm">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TalentCard;
