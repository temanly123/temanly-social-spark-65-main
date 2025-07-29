import { createClient } from '@supabase/supabase-js';

// Using the actual Supabase credentials from the client
const supabaseUrl = "https://enyrffgedfvgunokpmqk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingsAndReviews() {
  console.log('🔍 Checking bookings and review eligibility...\n');

  try {
    // 1. Check all bookings in the system
    console.log('1. Checking all bookings...');
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        user_profile:profiles!user_id(name, email),
        talent_profile:profiles!companion_id(name, email)
      `)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      return;
    }

    console.log(`📊 Total bookings in system: ${allBookings?.length || 0}`);

    if (allBookings && allBookings.length > 0) {
      console.log('\n📋 Booking details:');
      allBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ID: ${booking.id.slice(0, 8)}...`);
        console.log(`      User: ${booking.user_profile?.name || 'Unknown'}`);
        console.log(`      Talent: ${booking.talent_profile?.name || 'Unknown'}`);
        console.log(`      Status: ${booking.booking_status}`);
        console.log(`      Service: ${booking.service_type}`);
        console.log(`      Date: ${booking.date || 'Not set'}`);
        console.log(`      Created: ${new Date(booking.created_at).toLocaleDateString()}`);
        console.log('      ---');
      });

      // Check which bookings are eligible for reviews (completed status)
      const completedBookings = allBookings.filter(b => b.booking_status === 'completed');
      console.log(`\n✅ Completed bookings (eligible for reviews): ${completedBookings.length}`);

      if (completedBookings.length > 0) {
        console.log('📝 Completed bookings details:');
        completedBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.user_profile?.name} → ${booking.talent_profile?.name}`);
          console.log(`      Service: ${booking.service_type}`);
          console.log(`      Booking ID: ${booking.id}`);
        });
      }

      // Check for any existing reviews for these bookings
      console.log('\n2. Checking for existing reviews...');
      const bookingIds = allBookings.map(b => b.id);
      
      const { data: existingReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .in('booking_id', bookingIds);

      if (reviewsError) {
        console.error('❌ Error checking existing reviews:', reviewsError);
      } else {
        console.log(`📊 Existing reviews for these bookings: ${existingReviews?.length || 0}`);
      }

    } else {
      console.log('⚠️  No bookings found in the system.');
    }

    // 3. Check profiles to understand user relationships
    console.log('\n3. Checking user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, user_type')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`📊 Recent profiles: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.name} (${profile.user_type || 'user'}) - ${profile.id.slice(0, 8)}...`);
        });
      }
    }

    // 4. Check Amanda's specific profile
    console.log('\n4. Checking Amanda\'s profile specifically...');
    const amandaId = '9153feb4-6b65-4011-b894-f7268b3abe44';
    
    const { data: amandaProfile, error: amandaError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', amandaId)
      .single();

    if (amandaError) {
      console.error('❌ Error fetching Amanda\'s profile:', amandaError);
    } else if (amandaProfile) {
      console.log('✅ Amanda\'s profile found:');
      console.log(`   Name: ${amandaProfile.name}`);
      console.log(`   Type: ${amandaProfile.user_type || 'user'}`);
      console.log(`   Average Rating: ${amandaProfile.average_rating || 'Not set'}`);
      console.log(`   Total Orders: ${amandaProfile.total_orders || 0}`);
    } else {
      console.log('❌ Amanda\'s profile not found');
    }

    // 5. Check bookings involving Amanda
    console.log('\n5. Checking bookings involving Amanda...');
    const { data: amandaBookings, error: amandaBookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        user_profile:profiles!user_id(name),
        talent_profile:profiles!companion_id(name)
      `)
      .or(`user_id.eq.${amandaId},companion_id.eq.${amandaId}`)
      .order('created_at', { ascending: false });

    if (amandaBookingsError) {
      console.error('❌ Error fetching Amanda\'s bookings:', amandaBookingsError);
    } else {
      console.log(`📊 Bookings involving Amanda: ${amandaBookings?.length || 0}`);
      if (amandaBookings && amandaBookings.length > 0) {
        amandaBookings.forEach((booking, index) => {
          const isAmandaTalent = booking.companion_id === amandaId;
          console.log(`   ${index + 1}. ${isAmandaTalent ? 'As Talent' : 'As User'}: ${booking.booking_status}`);
          console.log(`      Service: ${booking.service_type}`);
          console.log(`      Other party: ${isAmandaTalent ? booking.user_profile?.name : booking.talent_profile?.name}`);
          console.log(`      Date: ${booking.date || 'Not set'}`);
        });
      }
    }

    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (!allBookings || allBookings.length === 0) {
      console.log('❌ ISSUE: No bookings found in the system.');
      console.log('   Reviews can only be created for completed bookings.');
      console.log('   You need to create and complete a booking first.');
    } else {
      const completedCount = allBookings.filter(b => b.booking_status === 'completed').length;
      if (completedCount === 0) {
        console.log('❌ ISSUE: No completed bookings found.');
        console.log('   Reviews can only be submitted for bookings with status "completed".');
        console.log('   Change booking status to "completed" to enable reviews.');
      } else {
        console.log('✅ Found completed bookings that should allow reviews.');
        console.log('   If you submitted a review but it\'s not showing:');
        console.log('   1. Check if the review was actually saved (database error)');
        console.log('   2. Check if the review needs admin approval (is_verified = false)');
        console.log('   3. Check for schema mismatches in the review system');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkBookingsAndReviews().then(() => {
  console.log('\n🏁 Bookings and reviews check completed');
  process.exit(0);
});
