import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Phone, Video, Users, Star, MapPin, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';
import TalentCard from '@/components/TalentCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedCity, setSelectedCity] = useState('all');
  const [cities, setCities] = useState<any[]>([]);
  const [featuredTalents, setFeaturedTalents] = useState<any[]>([]);
  const [newcomerTalents, setNewcomerTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch cities and talents on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use hardcoded cities for now since cities table might not exist
        const defaultCities = [
          { id: 1, name: 'Jakarta', is_active: true },
          { id: 2, name: 'Surabaya', is_active: true },
          { id: 3, name: 'Bandung', is_active: true },
          { id: 4, name: 'Medan', is_active: true },
          { id: 5, name: 'Semarang', is_active: true }
        ];
        setCities(defaultCities);

        // Fetch featured talents
        const { data: featuredData, error: featuredError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'companion')
          .eq('verification_status', 'verified')
          .eq('status', 'active')
          .eq('is_available', true)
          .eq('featured_talent', true)
          .order('average_rating', { ascending: false })
          .limit(6);

        if (featuredError) {
          console.error('Error fetching featured talents:', featuredError);
        } else {
          setFeaturedTalents(featuredData || []);
        }

        // Fetch newcomer talents
        const { data: newcomerData, error: newcomerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'companion')
          .eq('verification_status', 'verified')
          .eq('status', 'active')
          .eq('is_available', true)
          .eq('is_newcomer', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (newcomerError) {
          console.error('Error fetching newcomer talents:', newcomerError);
        } else {
          setNewcomerTalents(newcomerData || []);
        }

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Transform talent data for TalentCard component
  const transformTalentData = (talent: any) => ({
    id: talent.id,
    name: talent.name || talent.full_name,
    age: talent.age,
    city: talent.city || talent.location || 'Unknown',
    rating: talent.average_rating || talent.rating || 0,
    reviewCount: talent.total_orders || talent.total_bookings || 0,
    level: talent.talent_level === 'fresh' ? 'Fresh Talent' :
           talent.talent_level === 'elite' ? 'Elite Talent' :
           talent.talent_level === 'vip' ? 'VIP Talent' : 'Fresh Talent',
    image: talent.profile_image || '/placeholder.svg',
    services: talent.available_services || [],
    interests: talent.interests || [],
    zodiac: talent.zodiac || 'Not specified',
    loveLanguage: talent.love_language || 'Not specified',
    description: talent.bio || 'No description available',
    priceRange: talent.rent_lover_rate ? `25k - ${Math.floor(talent.rent_lover_rate / 1000)}k` : '25k - 85k',
    isOnline: talent.is_available || false,
    verified: talent.verification_status === 'verified',
    availability: 'Available for booking'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Temukan Teman <span className="text-pink-500">Perfect</span> Anda
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Platform rental talent terpercaya untuk kebutuhan sosial Anda.
            Call, video call, offline date, hingga party buddy.
          </p>

          {/* City Filter */}
          <div className="mb-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
              <MapPin className="w-5 h-5 text-gray-400" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="border-0 shadow-none">
                  <SelectValue placeholder="Pilih kota untuk melihat talent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kota</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Phone className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Voice Call</p>
              <p className="text-xs text-gray-500">40k/jam</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Video className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Video Call</p>
              <p className="text-xs text-gray-500">65k/jam</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Offline Date</p>
              <p className="text-xs text-gray-500">285k/3jam</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Party Buddy</p>
              <p className="text-xs text-gray-500">1M/event</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Star className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Rent a Lover</p>
              <p className="text-xs text-gray-500">up to 85k/hari</p>
            </div>
          </div>
        </section>





        {/* Featured Talents Section */}
        {!loading && featuredTalents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Talents</h2>
              <span className="text-sm text-gray-500">Talent dengan reputasi terbaik</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {featuredTalents
                .filter(talent => selectedCity === 'all' || talent.city === selectedCity || talent.location === selectedCity)
                .slice(0, 6)
                .map((talent) => (
                  <TalentCard key={talent.id} talent={transformTalentData(talent)} />
                ))}
            </div>
            {featuredTalents.filter(talent => selectedCity === 'all' || talent.city === selectedCity || talent.location === selectedCity).length === 0 && selectedCity !== 'all' && (
              <p className="text-center text-gray-500 py-8">Tidak ada featured talent di {selectedCity}</p>
            )}
          </section>
        )}

        {/* Newcomers Section */}
        {!loading && newcomerTalents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900">Newcomers</h2>
              <span className="text-sm text-gray-500">Talent baru yang baru lolos verifikasi</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {newcomerTalents
                .filter(talent => selectedCity === 'all' || talent.city === selectedCity || talent.location === selectedCity)
                .slice(0, 6)
                .map((talent) => (
                  <TalentCard key={talent.id} talent={transformTalentData(talent)} />
                ))}
            </div>
            {newcomerTalents.filter(talent => selectedCity === 'all' || talent.city === selectedCity || talent.location === selectedCity).length === 0 && selectedCity !== 'all' && (
              <p className="text-center text-gray-500 py-8">Tidak ada newcomer talent di {selectedCity}</p>
            )}
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat talent...</p>
          </section>
        )}
        {/* Browse Talents CTA */}
        <section className="text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Temukan Talent Perfect Anda</h3>
            <p className="text-lg text-gray-600 mb-6">
              Jelajahi ribuan talent terverifikasi dengan berbagai keahlian dan layanan
            </p>
            <Link to={selectedCity !== 'all' ? `/browse-talents?city=${selectedCity}` : '/browse-talents'}>
              <Button size="lg" className="bg-pink-500 hover:bg-pink-600">
                {selectedCity !== 'all' ? `Browse Talents di ${selectedCity}` : 'Browse All Talents'}
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
