import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceProfileRefresh() {
  console.log('🔄 Force refreshing Amanda\'s profile data...');

  try {
    const profileId = '9153fe0a-6b65-4011-b894-f7568b8abe44';

    // 1. First, check current state
    console.log('📊 Checking current profile state...');
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching profile:', fetchError);
      return;
    }

    console.log('Current profile data:');
    console.log(`  - Name: ${currentProfile.name}`);
    console.log(`  - Email: ${currentProfile.email}`);
    console.log(`  - Average Rating: ${currentProfile.average_rating}`);
    console.log(`  - Rating (old field): ${currentProfile.rating}`);
    console.log(`  - Total Orders: ${currentProfile.total_orders}`);

    // 2. Force update with clean data and new timestamp
    console.log('\n🧹 Force updating profile with clean data...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        // Explicitly set all rating-related fields to clean values
        average_rating: null,
        rating: null,
        total_orders: 0,
        // Force a new timestamp to break any caching
        updated_at: new Date().toISOString(),
        // Also update last_active to force refresh
        last_active: new Date().toISOString()
      })
      .eq('id', profileId)
      .select();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }

    console.log('✅ Profile force updated successfully!');

    // 3. Verify no reviews exist
    console.log('\n📝 Checking for any reviews...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .or(`talent_id.eq.${profileId},reviewee_id.eq.${profileId}`);

    if (!reviewsError) {
      console.log(`Found ${reviews?.length || 0} reviews`);
      if (reviews && reviews.length > 0) {
        console.log('⚠️  WARNING: Reviews still exist! Deleting them...');
        
        // Delete any remaining reviews
        const { error: deleteError } = await supabase
          .from('reviews')
          .delete()
          .or(`talent_id.eq.${profileId},reviewee_id.eq.${profileId}`);

        if (deleteError) {
          console.error('❌ Error deleting reviews:', deleteError);
        } else {
          console.log('✅ All reviews deleted!');
        }
      } else {
        console.log('✅ No reviews found (good!)');
      }
    }

    // 4. Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('id, name, average_rating, rating, total_orders, updated_at')
      .eq('id', profileId)
      .single();

    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }

    console.log('📋 Final profile state:');
    console.log(`  - Name: ${finalProfile.name}`);
    console.log(`  - Average Rating: ${finalProfile.average_rating || 'null (clean)'}`);
    console.log(`  - Rating (old): ${finalProfile.rating || 'null (clean)'}`);
    console.log(`  - Total Orders: ${finalProfile.total_orders}`);
    console.log(`  - Updated At: ${finalProfile.updated_at}`);

    // 5. Check if the issue is resolved
    const isClean = (finalProfile.average_rating === null || finalProfile.average_rating === 0) &&
                   (finalProfile.rating === null || finalProfile.rating === 0) &&
                   finalProfile.total_orders === 0;

    if (isClean) {
      console.log('\n🎉 PROFILE IS NOW COMPLETELY CLEAN!');
      console.log('✅ No fake ratings');
      console.log('✅ No fake reviews');
      console.log('✅ Clean production data only');
      console.log('\n💡 If you still see 4.8 in the browser:');
      console.log('   1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
      console.log('   2. Clear browser cache completely');
      console.log('   3. Try incognito/private browsing mode');
      console.log('   4. Close and reopen the browser');
      console.log('\n🔧 The issue might be browser caching or the app needs to be restarted.');
    } else {
      console.log('\n❌ PROFILE STILL HAS ISSUES!');
      if (finalProfile.average_rating > 0) console.log('   ❌ Average rating is still > 0');
      if (finalProfile.rating > 0) console.log('   ❌ Old rating field is still > 0');
      if (finalProfile.total_orders > 0) console.log('   ❌ Total orders is still > 0');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

forceProfileRefresh();
