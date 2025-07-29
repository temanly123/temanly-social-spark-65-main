import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, Loader2 } from 'lucide-react';
import TalentCard from '@/components/TalentCard';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

const BrowseTalents = () => {
  const [searchParams] = useSearchParams();
  const cityFromUrl = searchParams.get('city') || 'all';

  const [selectedCity, setSelectedCity] = useState(cityFromUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<any[]>([]);
  const { toast } = useToast();

  // Update selected city when URL changes
  useEffect(() => {
    setSelectedCity(cityFromUrl);
  }, [cityFromUrl]);

  // Load real data from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Use hardcoded cities for now since cities table might not exist
        const defaultCities = [
          { id: 1, name: 'Jakarta', is_active: true },
          { id: 2, name: 'Surabaya', is_active: true },
          { id: 3, name: 'Bandung', is_active: true },
          { id: 4, name: 'Medan', is_active: true },
          { id: 5, name: 'Semarang', is_active: true }
        ];
        setCities(defaultCities);

        // Fetch talents from database
        console.log('📝 Fetching real talents data from database');

        // First, let's check what companions exist at all
        const { data: allCompanions, error: allCompanionsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'companion');

        console.log('🔍 All companions in database:', allCompanions?.length || 0, allCompanions);

        // Check specifically for Amanda
        const { data: amandaCheck, error: amandaError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44');

        console.log('🔍 Amanda specific check:', amandaCheck, amandaError);

        // Now fetch the filtered talents
        const { data: talentsData, error: talentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'companion')
          .eq('verification_status', 'verified')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (talentsError) {
          console.error('Error fetching talents:', talentsError);
          toast({
            title: "Error",
            description: "Failed to load talents data",
            variant: "destructive"
          });
          setTalents([]);
        } else {
          console.log(`✅ Loaded ${talentsData?.length || 0} verified active talents from database`);
          console.log('📋 Verified talents:', talentsData);

          // Log each talent's key fields for debugging
          talentsData?.forEach((talent, index) => {
            console.log(`🔍 Talent ${index + 1}:`, {
              name: talent.name,
              email: talent.email,
              user_type: talent.user_type,
              verification_status: talent.verification_status,
              status: talent.status,
              available_services: talent.profile_data?.available_services,
              interests: talent.profile_data?.interests
            });
          });

          setTalents(talentsData || []);
        }
      } catch (error) {
        console.error('Unexpected error fetching data:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const services = [
    { id: 'all', name: 'All Services' },
    { id: 'chat', name: 'Chat' },
    { id: 'call', name: 'Voice Call' },
    { id: 'video', name: 'Video Call' },
    { id: 'offline-date', name: 'Offline Date' },
    { id: 'party-buddy', name: 'Party Buddy' },
    { id: 'rent-a-lover', name: 'Rent a Lover' }
  ];

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'fresh', name: 'Fresh Talent' },
    { id: 'elite', name: 'Elite Talent' },
    { id: 'vip', name: 'VIP Talent' }
  ];

  // Filter talents based on search criteria
  const filteredTalents = talents.filter(talent => {
    // Search query filter
    if (searchQuery && !talent.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // City filter
    if (selectedCity !== 'all') {
      const talentCity = talent.city || talent.location;
      if (!talentCity || !talentCity.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
    }

    // Service filter
    if (selectedService !== 'all') {
      const services = talent.profile_data?.available_services || talent.available_services || [];

      // Map frontend service IDs to database service types
      const serviceMapping: { [key: string]: string[] } = {
        'chat': ['chat'],
        'call': ['call'],
        'video': ['video_call'],
        'offline-date': ['offline_date'],
        'party-buddy': ['party_buddy'],
        'rent-a-lover': ['rent_lover']
      };

      const targetServices = serviceMapping[selectedService] || [selectedService];
      const hasService = targetServices.some(targetService => services.includes(targetService));

      if (!hasService) {
        return false;
      }
    }

    // Level filter
    if (selectedLevel !== 'all') {
      if (talent.talent_level !== selectedLevel) {
        return false;
      }
    }

    return true;
  });

  // Transform talent data for TalentCard component
  const transformedTalents = filteredTalents.map(talent => {
    console.log('🔄 Transforming talent:', talent.name, 'Profile data:', talent.profile_data);

    return {
      id: talent.id,
      name: talent.name || 'Unknown',
      age: talent.age || 25,
      city: talent.city || talent.location || 'Unknown',
      rating: talent.average_rating || talent.rating || 0,
      reviewCount: talent.total_bookings || talent.total_orders || 0,
      level: talent.talent_level === 'fresh' ? 'Fresh Talent' :
             talent.talent_level === 'elite' ? 'Elite Talent' :
             talent.talent_level === 'vip' ? 'VIP Talent' : 'Fresh Talent',
      image: talent.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      // Fix: Get services from profile_data.available_services
      services: talent.profile_data?.available_services || talent.available_services || [],
      // Fix: Get interests from profile_data.interests
      interests: talent.profile_data?.interests || talent.interests || [],
      zodiac: talent.zodiac || 'Unknown',
      loveLanguage: talent.love_language || 'Unknown',
      description: talent.bio || 'Professional companion with excellent communication skills',
      priceRange: talent.profile_data?.rent_lover_rate ? `25k - ${Math.floor(talent.profile_data.rent_lover_rate / 1000)}k` :
                  talent.hourly_rate ? `${Math.floor(talent.hourly_rate / 1000)}k/hour` : '25k - 85k',
      isOnline: talent.is_available !== false,
      verified: talent.verification_status === 'verified',
      availability: talent.is_available !== false ? 'Available for booking' : 'Currently unavailable'
    };
  });



  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Talents</h1>
          <p className="text-gray-600">Temukan talent yang sempurna untuk kebutuhan Anda</p>


        </div>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* City Filter */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari nama atau minat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Service Filter */}
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading talents...</p>
            </div>
          </div>
        )}



        {/* Results */}
        {!loading && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {transformedTalents.length} Talent ditemukan
                {selectedCity !== 'all' && ` di ${selectedCity}`}
              </h2>
            </div>

            {/* Talent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {transformedTalents.map((talent) => (
                <TalentCard key={talent.id} talent={talent} />
              ))}
            </div>

            {transformedTalents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Tidak ada talent yang sesuai dengan filter Anda</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedService('all');
                    setSelectedLevel('all');
                    setSelectedCity('all');
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  Reset Filter
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BrowseTalents;
