import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAmanda() {
  const amandaId = '9153feb4-6b65-4011-b894-f7268b3abe44';
  const amandaEmail = 'amanda.angela.soenoko@gmail.com';

  try {
    console.log('🔄 Syncing Amanda\'s profile...');

    // Check if Amanda exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', amandaId)
      .single();

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
      user_type: 'companion',
      verification_status: 'verified',
      status: 'active',
      talent_level: 'fresh',
      is_available: true,
      hourly_rate: 85000,
      party_buddy_eligible: true,
      profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      rating: 0, // No fake rating
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

    if (error) throw error;

    console.log('✅ Amanda\'s profile synced successfully');
    console.log('📊 Profile data:', data[0]);

    // Verify no reviews exist
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('talent_id', amandaId);

    if (reviewError) throw reviewError;

    console.log(`📝 Amanda has ${reviews?.length || 0} reviews`);

  } catch (error) {
    console.error('❌ Error syncing Amanda:', error);
  }
}

syncAmanda();
