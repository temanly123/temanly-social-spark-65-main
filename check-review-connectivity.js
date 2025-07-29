import { createClient } from '@supabase/supabase-js';

// Using the actual Supabase credentials from the client
const supabaseUrl = "https://enyrffgedfvgunokpmqk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviewConnectivity() {
  console.log('🔍 Checking review system connectivity...\n');

  try {
    // 1. Check reviews table schema
    console.log('1. Checking reviews table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('reviews')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema check error:', schemaError);
      console.log('🔧 This suggests a schema mismatch. The table might use different column names.');
      return;
    }

    console.log('✅ Reviews table is accessible');

    // 2. Check all reviews in the system
    console.log('\n2. Checking all reviews in the system...');
    const { data: allReviews, error: allError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all reviews:', allError);
    } else {
      console.log(`📊 Total reviews in system: ${allReviews?.length || 0}`);
      
      if (allReviews && allReviews.length > 0) {
        console.log('📋 Sample review structure:', Object.keys(allReviews[0]));
        
        // Check verification status
        const verifiedCount = allReviews.filter(r => r.is_verified).length;
        const pendingCount = allReviews.filter(r => !r.is_verified).length;
        
        console.log(`   ✅ Verified reviews: ${verifiedCount}`);
        console.log(`   ⏳ Pending reviews: ${pendingCount}`);
      }
    }

    // 3. Check reviews with profile joins (admin dashboard query)
    console.log('\n3. Testing admin dashboard query...');
    const { data: adminReviews, error: adminError } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(name),
        reviewee:profiles!reviewee_id(name),
        booking:bookings(service_type)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (adminError) {
      console.error('❌ Admin query error:', adminError);
      console.log('🔧 This suggests the column names might be user_id/talent_id instead of reviewer_id/reviewee_id');
    } else {
      console.log(`✅ Admin query successful: ${adminReviews?.length || 0} reviews fetched`);
    }

    // 4. Check reviews for talent profile (frontend query)
    console.log('\n4. Testing talent profile query...');
    const { data: talentReviews, error: talentError } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviewer_id(name, profile_image),
        bookings(service_name, service_type, duration, date)
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (talentError) {
      console.error('❌ Talent profile query error:', talentError);
    } else {
      console.log(`✅ Talent profile query successful: ${talentReviews?.length || 0} verified reviews`);
    }

    // 5. Check specific user's reviews (Amanda's case)
    console.log('\n5. Checking Amanda\'s reviews specifically...');
    const amandaId = '9153feb4-6b65-4011-b894-f7268b3abe44'; // Amanda's ID from the code
    
    const { data: amandaReviews, error: amandaError } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(name),
        reviewee:profiles!reviewee_id(name)
      `)
      .eq('reviewee_id', amandaId)
      .order('created_at', { ascending: false });

    if (amandaError) {
      console.error('❌ Amanda reviews query error:', amandaError);
    } else {
      console.log(`📊 Amanda's reviews: ${amandaReviews?.length || 0}`);
      if (amandaReviews && amandaReviews.length > 0) {
        amandaReviews.forEach((review, index) => {
          console.log(`   Review ${index + 1}: ${review.rating}⭐ by ${review.reviewer?.name || 'Unknown'} - ${review.is_verified ? 'Verified' : 'Pending'}`);
        });
      }
    }

    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(50));
    
    if (allReviews && allReviews.length > 0) {
      const pendingReviews = allReviews.filter(r => !r.is_verified);
      
      if (pendingReviews.length > 0) {
        console.log('⚠️  ISSUE FOUND: You have pending reviews that need admin approval!');
        console.log(`   ${pendingReviews.length} reviews are waiting for verification.`);
        console.log('   Reviews only show up after admin approval (is_verified = true).');
        console.log('\n🔧 SOLUTION: Go to Admin Dashboard > Review Management and approve the pending reviews.');
      } else {
        console.log('✅ All reviews are verified and should be visible.');
      }
    } else {
      console.log('⚠️  No reviews found in the system.');
      console.log('   Make sure reviews are being created properly.');
    }

    if (adminError || talentError) {
      console.log('\n🔧 SCHEMA FIX NEEDED:');
      console.log('   Run the fix-review-schema-mismatch.js script to fix column name mismatches.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkReviewConnectivity().then(() => {
  console.log('\n🏁 Review connectivity check completed');
  process.exit(0);
});
