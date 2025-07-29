import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviews() {
  console.log('🔍 Checking for fake reviews and ratings...');
  
  try {
    // Check Amanda's profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44')
      .single();
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log('📋 Amanda\'s Profile Data:');
    console.log('   - Name:', profile.name);
    console.log('   - Average Rating:', profile.average_rating);
    console.log('   - Total Orders:', profile.total_orders);
    console.log('   - Rating (old field):', profile.rating);
    console.log('');
    
    // Check for any reviews for Amanda - try different column names
    let reviews = [];
    let reviewsError = null;

    // Try talent_id first
    const { data: reviews1, error: error1 } = await supabase
      .from('reviews')
      .select('*')
      .eq('talent_id', '9153fe0a-6b65-4011-b894-f7568b8abe44');

    if (error1) {
      console.log('   - talent_id column not found, trying reviewee_id...');
      // Try reviewee_id
      const { data: reviews2, error: error2 } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', '9153fe0a-6b65-4011-b894-f7568b8abe44');

      if (error2) {
        console.log('   - reviewee_id column not found, checking table structure...');
        // Get table structure
        const { data: tableInfo, error: tableError } = await supabase
          .from('reviews')
          .select('*')
          .limit(1);

        if (tableError) {
          console.error('❌ Error checking reviews table:', tableError);
          reviewsError = tableError;
        } else {
          console.log('   - Reviews table structure:', tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'Empty table');
          reviews = [];
        }
      } else {
        reviews = reviews2 || [];
      }
    } else {
      reviews = reviews1 || [];
    }
    
    console.log('📝 Reviews for Amanda:');
    console.log('   - Total Reviews:', reviews.length);
    
    if (reviews.length > 0) {
      console.log('   - FOUND FAKE REVIEWS! Deleting them...');
      reviews.forEach((review, index) => {
        console.log(`   - Review ${index + 1}: Rating ${review.rating}, Text: "${review.review_text}"`);
      });
      
      // Delete all fake reviews - try both column names
      let deleteError = null;

      const { error: deleteError1 } = await supabase
        .from('reviews')
        .delete()
        .eq('talent_id', '9153fe0a-6b65-4011-b894-f7568b8abe44');

      if (deleteError1) {
        const { error: deleteError2 } = await supabase
          .from('reviews')
          .delete()
          .eq('reviewee_id', '9153fe0a-6b65-4011-b894-f7568b8abe44');
        deleteError = deleteError2;
      } else {
        deleteError = deleteError1;
      }
        
      if (deleteError) {
        console.error('❌ Error deleting fake reviews:', deleteError);
      } else {
        console.log('✅ All fake reviews deleted!');
      }
    } else {
      console.log('   - No reviews found (good!)');
    }
    
    // Now fix the profile rating
    console.log('');
    console.log('🔧 Fixing profile rating...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        average_rating: 0.0,  // Set to 0 instead of null
        rating: 0.0,          // Set to 0 instead of null
        total_orders: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44');
      
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
    } else {
      console.log('✅ Profile rating fixed!');
      console.log('✅ Rating is now 0.0');
      console.log('✅ Total orders reset to 0');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkReviews().catch(console.error);
