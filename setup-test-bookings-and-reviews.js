import { createClient } from '@supabase/supabase-js';

// Using the actual Supabase credentials from the client
const supabaseUrl = "https://enyrffgedfvgunokpmqk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestBookingsAndReviews() {
  console.log('🚀 Setting up test bookings and reviews...\n');

  try {
    // 1. First, get the existing profiles
    console.log('1. Fetching existing profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles?.length || 0} profiles`);
    
    if (!profiles || profiles.length < 2) {
      console.log('❌ Need at least 2 profiles (user and talent) to create bookings');
      return;
    }

    // Find user and talent profiles
    const userProfile = profiles.find(p => p.user_type === 'user' || !p.user_type);
    const talentProfile = profiles.find(p => p.user_type === 'companion');

    if (!userProfile || !talentProfile) {
      console.log('❌ Could not find both user and talent profiles');
      console.log('Available profiles:', profiles.map(p => ({ name: p.name, type: p.user_type })));
      return;
    }

    console.log(`✅ User: ${userProfile.name} (${userProfile.id.slice(0, 8)}...)`);
    console.log(`✅ Talent: ${talentProfile.name} (${talentProfile.id.slice(0, 8)}...)`);

    // 2. Create test bookings
    console.log('\n2. Creating test bookings...');
    
    const testBookings = [
      {
        user_id: userProfile.id,
        companion_id: talentProfile.id,
        service_type: 'video_call',
        service_name: 'Video Call',
        date: '2025-01-27',
        duration: 4,
        total_price: 214500,
        booking_status: 'completed',
        customer_name: userProfile.name,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        user_id: userProfile.id,
        companion_id: talentProfile.id,
        service_type: 'chat',
        service_name: 'Chat',
        date: '2025-01-26',
        duration: 1,
        total_price: 30000,
        booking_status: 'completed',
        customer_name: userProfile.name,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        user_id: userProfile.id,
        companion_id: talentProfile.id,
        service_type: 'chat',
        service_name: 'Chat',
        date: '2025-01-25',
        duration: 1,
        total_price: 25000,
        booking_status: 'completed',
        customer_name: userProfile.name,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      }
    ];

    const { data: createdBookings, error: bookingsError } = await supabase
      .from('bookings')
      .insert(testBookings)
      .select();

    if (bookingsError) {
      console.error('❌ Error creating bookings:', bookingsError);
      return;
    }

    console.log(`✅ Created ${createdBookings?.length || 0} test bookings`);

    // 3. Create test reviews for these bookings
    console.log('\n3. Creating test reviews...');
    
    const testReviews = [
      {
        booking_id: createdBookings[0].id,
        reviewer_id: userProfile.id,
        reviewee_id: talentProfile.id,
        rating: 5,
        comment: 'Amazing experience! Amanda was very professional and engaging during our video call. Highly recommended!',
        is_verified: true, // Pre-approved for immediate visibility
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        booking_id: createdBookings[1].id,
        reviewer_id: userProfile.id,
        reviewee_id: talentProfile.id,
        rating: 4,
        comment: 'Great chat session. Very friendly and responsive. Would book again!',
        is_verified: false, // Pending admin approval
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        booking_id: createdBookings[2].id,
        reviewer_id: userProfile.id,
        reviewee_id: talentProfile.id,
        rating: 5,
        comment: 'Excellent service! Very professional and made me feel comfortable throughout the session.',
        is_verified: true, // Pre-approved for immediate visibility
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }
    ];

    const { data: createdReviews, error: reviewsError } = await supabase
      .from('reviews')
      .insert(testReviews)
      .select();

    if (reviewsError) {
      console.error('❌ Error creating reviews:', reviewsError);
      console.error('Error details:', reviewsError);
      return;
    }

    console.log(`✅ Created ${createdReviews?.length || 0} test reviews`);

    // 4. Update talent's average rating and total orders
    console.log('\n4. Updating talent statistics...');
    
    const verifiedReviews = testReviews.filter(r => r.is_verified);
    const averageRating = verifiedReviews.reduce((sum, r) => sum + r.rating, 0) / verifiedReviews.length;
    const totalOrders = createdBookings.filter(b => b.booking_status === 'completed').length;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        average_rating: averageRating,
        total_orders: totalOrders,
        updated_at: new Date().toISOString()
      })
      .eq('id', talentProfile.id);

    if (updateError) {
      console.error('❌ Error updating talent statistics:', updateError);
    } else {
      console.log(`✅ Updated talent statistics: ${averageRating.toFixed(1)} stars, ${totalOrders} orders`);
    }

    // 5. Verify the setup
    console.log('\n5. Verifying the setup...');
    
    // Check bookings
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('companion_id', talentProfile.id);

    // Check reviews
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', talentProfile.id);

    console.log(`📊 Total bookings for ${talentProfile.name}: ${allBookings?.length || 0}`);
    console.log(`📊 Total reviews for ${talentProfile.name}: ${allReviews?.length || 0}`);
    console.log(`📊 Verified reviews: ${allReviews?.filter(r => r.is_verified).length || 0}`);
    console.log(`📊 Pending reviews: ${allReviews?.filter(r => !r.is_verified).length || 0}`);

    // 6. Summary
    console.log('\n📋 SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log('✅ Test data has been created successfully!');
    console.log('');
    console.log('🔍 What you can now test:');
    console.log('1. Admin Dashboard → Review Management (should show reviews)');
    console.log('2. User Dashboard → Service History (should show completed bookings)');
    console.log('3. Talent Profile → Reviews Tab (should show verified reviews)');
    console.log('4. Talent Dashboard → Reviews section (should show received reviews)');
    console.log('');
    console.log('📝 Next steps:');
    console.log('- Go to Admin Dashboard to approve the pending review');
    console.log('- Check that reviews appear in all dashboards');
    console.log('- Test the review submission flow with new bookings');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupTestBookingsAndReviews().then(() => {
  console.log('\n🏁 Test setup completed');
  process.exit(0);
});
