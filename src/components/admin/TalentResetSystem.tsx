import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trash2, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  UserPlus,
  Star,
  MapPin,
  Heart,
  Briefcase
} from 'lucide-react';

interface TalentResetSystemProps {
  onResetComplete?: () => void;
}

const TalentResetSystem: React.FC<TalentResetSystemProps> = ({ onResetComplete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [step, setStep] = useState<'idle' | 'deleting' | 'creating' | 'complete'>('idle');
  const { toast } = useToast();

  // DEPRECATED: This component creates demo data and is deprecated for production use
  const isDeprecated = true;

  // New talent data according to Temanly specifications
  const newTalentsData = [
    {
      name: 'Sari Dewi',
      level: 'Elite',
      city: 'Jakarta',
      specialties: ['Digital Marketing', 'Content Creation', 'Social Media Strategy'],
      services: ['Chat', 'Call', 'Video Call', 'Offline Date', 'Party Buddy', 'Rent a Lover'],
      zodiac: 'Leo',
      loveLanguage: 'Words of Affirmation',
      rentLoverRate: 85000
    },
    {
      name: 'Amanda Fitri',
      level: 'VIP',
      city: 'Bandung',
      specialties: ['Fitness Training', 'Wellness Coaching', 'Outdoor Adventures'],
      services: ['Chat', 'Call', 'Video Call', 'Offline Date', 'Party Buddy', 'Rent a Lover'],
      zodiac: 'Aries',
      loveLanguage: 'Physical Touch',
      rentLoverRate: 80000
    },
    {
      name: 'Luna Maharani',
      level: 'Fresh',
      city: 'Yogyakarta',
      specialties: ['Art & Culture', 'Photography', 'Creative Writing'],
      services: ['Chat', 'Call', 'Video Call', 'Offline Date'],
      zodiac: 'Pisces',
      loveLanguage: 'Quality Time',
      rentLoverRate: 65000
    },
    {
      name: 'Kirana Putri',
      level: 'Elite',
      city: 'Surabaya',
      specialties: ['Business Consultation', 'Luxury Lifestyle', 'High-end Social'],
      services: ['Chat', 'Call', 'Video Call', 'Offline Date', 'Party Buddy', 'Rent a Lover'],
      zodiac: 'Capricorn',
      loveLanguage: 'Receiving Gifts',
      rentLoverRate: 95000
    },
    {
      name: 'Rara Teknologi',
      level: 'Fresh',
      city: 'Medan',
      specialties: ['Gaming', 'Technology', 'Programming'],
      services: ['Chat', 'Call', 'Video Call', 'Offline Date'],
      zodiac: 'Gemini',
      loveLanguage: 'Acts of Service',
      rentLoverRate: 70000
    }
  ];

  const handleBulkDeleteTalents = async () => {
    try {
      setIsDeleting(true);
      setStep('deleting');
      
      console.log('🗑️ Starting bulk talent deletion...');
      
      const { data, error } = await supabase.functions.invoke('admin-bulk-delete-talents');
      
      if (error) {
        console.error('❌ Bulk deletion error:', error);
        throw error;
      }
      
      console.log('✅ Bulk deletion completed:', data);
      
      toast({
        title: "🗑️ Talents Deleted",
        description: `Successfully deleted ${data.deletedTalents || 0} talents and all related data.`,
        className: "bg-red-50 border-red-200"
      });
      
      return data;
      
    } catch (error: any) {
      console.error('❌ Bulk deletion failed:', error);
      toast({
        title: "❌ Deletion Failed",
        description: error.message || "Failed to delete talents",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to create service configurations
  const createServiceConfigurations = async (talentId: string, talentData: any) => {
    try {
      console.log(`📋 Creating service configurations for ${talentData.name}...`);

      const serviceConfigs = talentData.services.map((service: string) => ({
        talent_id: talentId,
        service_type: service.toLowerCase().replace(' ', '_'),
        is_available: true,
        custom_rate: service === 'rent_lover' ? talentData.rentLoverRate : null,
        description: service === 'rent_lover' ? `Custom rent a lover package for ${talentData.name}` : null
      }));

      const { error } = await supabase
        .from('service_configurations')
        .insert(serviceConfigs);

      if (error) {
        console.warn(`⚠️ Service configurations creation failed for ${talentData.name}:`, error);
      } else {
        console.log(`✅ Service configurations created for ${talentData.name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Service configurations error for ${talentData.name}:`, error);
    }
  };

  // Helper function to create availability slots
  const createAvailabilitySlots = async (talentId: string, talentData: any) => {
    try {
      console.log(`📅 Creating availability slots for ${talentData.name}...`);

      const availabilitySlots = [];
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      // Create slots for offline_date and party_buddy services
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = weekdays[dayIndex];

        // Offline date availability
        if (talentData.services.includes('Offline Date')) {
          availabilitySlots.push({
            talent_id: talentId,
            service_type: 'offline_date',
            day_of_week: dayIndex,
            start_time: '09:00',
            end_time: '22:00',
            is_available: true,
            max_bookings_per_slot: 2
          });
        }

        // Party buddy availability (only weekends for most talents)
        if (talentData.services.includes('Party Buddy') && (dayIndex === 5 || dayIndex === 6)) {
          availabilitySlots.push({
            talent_id: talentId,
            service_type: 'party_buddy',
            day_of_week: dayIndex,
            start_time: '20:00',
            end_time: '04:00',
            is_available: true,
            max_bookings_per_slot: 1
          });
        }
      }

      if (availabilitySlots.length > 0) {
        const { error } = await supabase
          .from('availability_slots')
          .insert(availabilitySlots);

        if (error) {
          console.warn(`⚠️ Availability slots creation failed for ${talentData.name}:`, error);
        } else {
          console.log(`✅ Availability slots created for ${talentData.name}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Availability slots error for ${talentData.name}:`, error);
    }
  };

  // Helper function to create talent interests
  const createTalentInterests = async (talentId: string, talentData: any) => {
    try {
      console.log(`🎯 Creating talent interests for ${talentData.name}...`);

      // Get existing interests from the database
      const { data: existingInterests, error: interestsError } = await supabase
        .from('talent_interests')
        .select('id, name');

      if (interestsError) {
        console.warn(`⚠️ Failed to fetch interests:`, interestsError);
        return;
      }

      // Map talent specialties to interest IDs
      const interestMappings = [];
      for (const specialty of talentData.specialties) {
        const matchingInterest = existingInterests?.find(interest =>
          interest.name.toLowerCase().includes(specialty.toLowerCase()) ||
          specialty.toLowerCase().includes(interest.name.toLowerCase())
        );

        if (matchingInterest) {
          interestMappings.push({
            talent_id: talentId,
            interest_id: matchingInterest.id
          });
        }
      }

      if (interestMappings.length > 0) {
        const { error } = await supabase
          .from('talent_profile_interests')
          .insert(interestMappings);

        if (error) {
          console.warn(`⚠️ Talent interests creation failed for ${talentData.name}:`, error);
        } else {
          console.log(`✅ Talent interests created for ${talentData.name}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Talent interests error for ${talentData.name}:`, error);
    }
  };

  // Helper function to create demo reviews
  const createDemoReviews = async (talentId: string, talentData: any) => {
    try {
      console.log(`⭐ Creating demo reviews for ${talentData.name}...`);

      // Create demo user IDs (these would be real user IDs in production)
      const demoUserIds = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005'
      ];

      // Create demo booking IDs (these would be real booking IDs in production)
      const demoBookingIds = [
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000013',
        '00000000-0000-0000-0000-000000000014',
        '00000000-0000-0000-0000-000000000015'
      ];

      // Sample reviews based on talent level and specialties
      const reviewTemplates = {
        'Sari Dewi': [
          { rating: 5, text: 'Sari sangat membantu dalam strategi digital marketing bisnis saya! Profesional dan knowledgeable banget. Highly recommended!' },
          { rating: 5, text: 'Content creation tips dari Sari benar-benar game changer untuk brand saya. Thank you so much!' },
          { rating: 4, text: 'Great conversation partner dan banyak insight tentang social media. Will book again!' },
          { rating: 5, text: 'Sari is amazing! Helped me understand brand development better. Very professional service.' },
          { rating: 4, text: 'Enjoyed our museum date! Sari sangat interesting dan fun to talk with.' }
        ],
        'Amanda Fitri': [
          { rating: 5, text: 'Amanda is the best fitness companion! Motivating dan sangat knowledgeable about wellness. Love it!' },
          { rating: 5, text: 'Hiking trip dengan Amanda was amazing! She knows all the best spots and very encouraging.' },
          { rating: 5, text: 'Best workout buddy ever! Amanda helped me achieve my fitness goals. Highly recommended!' },
          { rating: 4, text: 'Great party companion! Amanda brings such positive energy and fun vibes.' },
          { rating: 5, text: 'Cycling adventure dengan Amanda was fantastic! Professional and very friendly.' }
        ],
        'Luna Maharani': [
          { rating: 5, text: 'Luna is so creative and inspiring! Our art gallery visit was amazing. She knows so much about art!' },
          { rating: 4, text: 'Great conversation about creative writing. Luna has such interesting perspectives!' },
          { rating: 5, text: 'Museum date dengan Luna was perfect! She made art appreciation so much more fun.' },
          { rating: 4, text: 'Luna is very sweet and artistic. Enjoyed our coffee chat about photography!' },
          { rating: 4, text: 'Creative and thoughtful companion. Luna brings fresh ideas to every conversation.' }
        ],
        'Kirana Putri': [
          { rating: 5, text: 'Kirana is the perfect business companion! Very sophisticated and professional for networking events.' },
          { rating: 5, text: 'Excellent business consultation! Kirana really understands investment and luxury lifestyle.' },
          { rating: 4, text: 'Great companion for fine dining. Kirana has excellent taste and very elegant.' },
          { rating: 5, text: 'Perfect for high-end social gatherings. Kirana adapts well to any situation!' },
          { rating: 5, text: 'Business dinner dengan Kirana was perfect! Very knowledgeable and well-educated.' }
        ],
        'Rara Teknologi': [
          { rating: 4, text: 'Rara is the best gaming buddy! We had so much fun playing together. Very skilled gamer!' },
          { rating: 5, text: 'Great tech consultation! Rara helped me understand latest gadget trends. Very knowledgeable!' },
          { rating: 4, text: 'Fun gaming session dengan Rara! She knows all the best games and strategies.' },
          { rating: 4, text: 'Enjoyed our conversation about programming. Rara is very smart and helpful!' },
          { rating: 5, text: 'Perfect digital lifestyle companion! Rara understands tech world very well.' }
        ]
      };

      const reviews = reviewTemplates[talentData.name as keyof typeof reviewTemplates] || [];

      const reviewsToCreate = reviews.slice(0, Math.min(reviews.length, talentData.total_orders || 5)).map((review, index) => ({
        booking_id: demoBookingIds[index],
        talent_id: talentId,
        user_id: demoUserIds[index],
        rating: review.rating,
        review_text: review.text,
        is_verified: true,
        verified_by: '00000000-0000-0000-0000-000000000000', // Admin ID
        verified_at: new Date().toISOString(),
        created_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString() // Spread over past days
      }));

      if (reviewsToCreate.length > 0) {
        const { error } = await supabase
          .from('reviews')
          .insert(reviewsToCreate);

        if (error) {
          console.warn(`⚠️ Demo reviews creation failed for ${talentData.name}:`, error);
        } else {
          console.log(`✅ Demo reviews created for ${talentData.name}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Demo reviews error for ${talentData.name}:`, error);
    }
  };

  const createNewTalents = async () => {
    try {
      setIsCreating(true);
      setStep('creating');

      console.log('👥 Starting talent creation...');

      const createdTalents = [];
      
      for (let i = 0; i < newTalentsData.length; i++) {
        const talentData = newTalentsData[i];
        console.log(`📝 Creating talent ${i + 1}: ${talentData.name}...`);
        
        // Create comprehensive talent data
        const talentProfile = {
          personalInfo: {
            name: talentData.name,
            email: `${talentData.name.toLowerCase().replace(' ', '.')}@temanly.demo`,
            phone: `+628123456789${i}`,
            age: 22 + i,
            location: `${talentData.city} Selatan`,
            city: talentData.city,
            bio: `Professional ${talentData.specialties.join(', ')} specialist. Passionate about creating amazing experiences and building meaningful connections.`,
            zodiac: talentData.zodiac,
            love_language: talentData.loveLanguage
          },
          services: {
            available_services: talentData.services.map(s => s.toLowerCase().replace(' ', '_')),
            rent_lover_rate: talentData.rentLoverRate,
            rent_lover_description: `Complete package with unlimited chat, calls, and personalized attention. Perfect for virtual relationship experience.`
          },
          interests: talentData.specialties,
          availability: {
            weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            timeSlots: ['09:00-17:00', '19:00-22:00'],
            partyBuddyAvailable: talentData.services.includes('Party Buddy')
          },
          profile: {
            talent_level: talentData.level.toLowerCase(),
            total_orders: talentData.level === 'VIP' ? 120 : talentData.level === 'Elite' ? 50 : 10,
            average_rating: talentData.level === 'VIP' ? 4.9 : talentData.level === 'Elite' ? 4.7 : 4.5,
            featured_talent: talentData.level !== 'Fresh',
            is_newcomer: talentData.level === 'Fresh',
            specialties: talentData.specialties,
            experience: `${3 + i} years experience`,
            languages: ['Bahasa Indonesia', 'English'],
            education: 'University Graduate',
            hobbies: talentData.specialties
          }
        };
        
        try {
          const { data: createResult, error: createError } = await supabase.functions.invoke('create-talent-profile', {
            body: talentProfile
          });
          
          if (createError) {
            console.error(`❌ Error creating talent ${talentData.name}:`, createError);
            continue;
          }
          
          console.log(`✅ Created talent: ${talentData.name}`);
          createdTalents.push({ ...talentData, id: createResult?.id });

          // Create service configurations for this talent
          if (createResult?.id) {
            await createServiceConfigurations(createResult.id, talentData);
            await createAvailabilitySlots(createResult.id, talentData);
            await createTalentInterests(createResult.id, talentData);
            await createDemoReviews(createResult.id, talentData);
          }

          // Wait between creations
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Exception creating talent ${talentData.name}:`, error);
        }
      }
      
      console.log(`✅ Created ${createdTalents.length} talents`);
      
      toast({
        title: "👥 Talents Created",
        description: `Successfully created ${createdTalents.length} new talent profiles.`,
        className: "bg-green-50 border-green-200"
      });
      
      return createdTalents;
      
    } catch (error: any) {
      console.error('❌ Talent creation failed:', error);
      toast({
        title: "❌ Creation Failed",
        description: error.message || "Failed to create talents",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompleteReset = async () => {
    try {
      setStep('deleting');
      
      // Step 1: Delete all existing talents
      const deleteResult = await handleBulkDeleteTalents();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Create new talents
      const createResult = await createNewTalents();
      
      setStep('complete');
      setResetResult({
        deletedTalents: deleteResult?.deletedTalents || 0,
        createdTalents: createResult?.length || 0,
        talentNames: createResult?.map(t => t.name) || []
      });
      
      toast({
        title: "🎉 Reset Complete",
        description: `Successfully reset talent system with ${createResult?.length || 0} new talents.`,
        className: "bg-blue-50 border-blue-200"
      });
      
      if (onResetComplete) {
        onResetComplete();
      }
      
    } catch (error) {
      setStep('idle');
      console.error('❌ Complete reset failed:', error);
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'VIP': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Elite': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fresh': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Show deprecation warning for production
  if (isDeprecated) {
    return (
      <div className="space-y-6">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>⚠️ DEPRECATED FOR PRODUCTION:</strong> This component creates demo/mock data and has been disabled for production use.
            <br />
            This component has been disabled for production use.
            <br />
            For real talent management, use the <strong>Talent Applications</strong> tab to approve genuine talent registrations.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <Database className="w-16 h-16 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-600">Component Disabled</h3>
                <p className="text-gray-500">This demo data creation tool is not available in production mode.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Talent Reset System
          </CardTitle>
          <CardDescription>
            Deep delete all existing talent data and create 5 new comprehensive talent profiles according to Temanly specifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> This will permanently delete ALL existing talent data including profiles, documents, reviews, bookings, and related records. This action cannot be undone.
            </AlertDescription>
          </Alert>

          {/* New Talents Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">New Talents to be Created</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newTalentsData.map((talent, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{talent.name}</h4>
                        <Badge className={getLevelBadgeColor(talent.level)}>
                          {talent.level}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {talent.city}
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Heart className="h-3 w-3" />
                        {talent.zodiac} • {talent.loveLanguage}
                      </div>
                      
                      <div className="text-sm">
                        <strong>Rent a Lover:</strong> Rp {talent.rentLoverRate.toLocaleString()}/day
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <strong>Specialties:</strong> {talent.specialties.slice(0, 2).join(', ')}
                        {talent.specialties.length > 2 && '...'}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <strong>Services:</strong> {talent.services.length} available
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleBulkDeleteTalents}
              disabled={isDeleting || isCreating || step !== 'idle'}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete All Talents Only
            </Button>

            <Button
              onClick={createNewTalents}
              disabled={isDeleting || isCreating || step !== 'idle'}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create New Talents Only
            </Button>

            <Button
              onClick={handleCompleteReset}
              disabled={isDeleting || isCreating || step !== 'idle'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {(isDeleting || isCreating) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Complete Reset (Delete + Create)
            </Button>
          </div>

          {/* Progress Indicator */}
          {step !== 'idle' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {step === 'deleting' && '🗑️ Deleting existing talents...'}
                {step === 'creating' && '👥 Creating new talents...'}
                {step === 'complete' && '✅ Reset completed!'}
              </div>
              
              {step !== 'complete' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: step === 'deleting' ? '50%' : step === 'creating' ? '100%' : '0%' 
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {resetResult && step === 'complete' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Reset Completed Successfully!</strong>
                <br />
                • Deleted: {resetResult.deletedTalents} existing talents
                <br />
                • Created: {resetResult.createdTalents} new talents
                <br />
                • New talents: {resetResult.talentNames?.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentResetSystem;
