import { supabase } from '@/integrations/supabase/client';

// Utility function to ensure Amanda is properly synced with correct data
export const ensureAmandaSync = async () => {
  const amandaId = '9153fe0a-6b65-4011-b894-f7568b8abe44';
  const amandaEmail = 'angela.soenoko@gmail.com';

  try {
    console.log('🔍 Checking Amanda sync status...');

    // Check if Amanda exists
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', amandaId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking Amanda:', checkError);
      return { success: false, error: checkError.message };
    }

    const amandaData = {
      id: amandaId,
      name: 'Amanda Angela Soenoko',
      full_name: 'Amanda Angela Soenoko',
      email: amandaEmail,
      phone: '081563961876',
      age: 25,
      location: 'Cimahi',
      city: 'Cimahi',
      zodiac: 'Gemini',
      love_language: 'Quality Time',
      bio: 'Friendly and outgoing companion who loves meeting new people and creating memorable experiences. Available for various services with professional approach.',
      user_type: 'companion' as const,
      verification_status: 'verified' as const,
      status: 'active' as const,
      talent_level: 'fresh' as const,
      is_available: true,
      hourly_rate: 85000,
      party_buddy_eligible: true,
      profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      rating: 0,
      total_bookings: 0,
      total_earnings: 0,
      profile_data: {
        available_services: ['chat', 'call', 'video_call', 'offline_date', 'party_buddy'],
        interests: ['Sushi Date', 'Movie Date', 'Shopping', 'Karaoke', 'Coffee Chat'],
        offline_availability: 'Available weekends and evenings',
        party_buddy_rate: 1000000,
        rent_lover_rate: 85000,
        rent_lover_includes: 'Complete companion experience with personalized attention and professional service'
      },
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upsert Amanda's data
    const { data, error } = await supabase
      .from('profiles')
      .upsert(amandaData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('❌ Error syncing Amanda:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Amanda successfully synced:', data);
    return { success: true, data };

  } catch (error: any) {
    console.error('💥 Unexpected error syncing Amanda:', error);
    return { success: false, error: error.message };
  }
};

// Function to verify Amanda appears in Browse Talents query
export const verifyAmandaInBrowse = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'companion')
      .eq('verification_status', 'verified')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const amandaInResults = data?.find(profile => profile.email === 'angela.soenoko@gmail.com');
    
    return {
      success: true,
      totalTalents: data?.length || 0,
      amandaFound: !!amandaInResults,
      amandaData: amandaInResults
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
