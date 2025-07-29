import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRatingFix() {
  console.log('🔍 Verifying rating fix for Amanda...');
  
  try {
    // Check Amanda's current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44')
      .single();
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log('📋 Current Profile Data:');
    console.log('   - ID:', profile.id);
    console.log('   - Name:', profile.name);
    console.log('   - Email:', profile.email);
    console.log('   - Average Rating:', profile.average_rating);
    console.log('   - Rating (old field):', profile.rating);
    console.log('   - Total Orders:', profile.total_orders);
    console.log('   - Updated At:', profile.updated_at);
    console.log('');
    
    // Check for any reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', '9153fe0a-6b65-4011-b894-f7568b8abe44');
      
    if (!reviewsError) {
      console.log('📝 Reviews Status:');
      console.log('   - Total Reviews:', reviews.length);
      if (reviews.length > 0) {
        console.log('⚠️  WARNING: Reviews still exist!');
        reviews.forEach((review, index) => {
          console.log(`   - Review ${index + 1}: Rating ${review.rating}, Text: "${review.review_text}"`);
        });
      } else {
        console.log('   ✅ No reviews found (correct!)');
      }
    }
    console.log('');
    
    // Verify the fix
    const isFixed = (profile.average_rating === 0 || profile.average_rating === null) && 
                   (profile.rating === 0 || profile.rating === null) && 
                   profile.total_orders === 0 && 
                   reviews.length === 0;
    
    if (isFixed) {
      console.log('✅ RATING FIX SUCCESSFUL!');
      console.log('   ✅ Average rating is 0 or null');
      console.log('   ✅ Old rating field is 0 or null');
      console.log('   ✅ Total orders is 0');
      console.log('   ✅ No fake reviews exist');
      console.log('');
      console.log('🔄 Please refresh your browser to see the changes.');
      console.log('💡 If you still see 4.8, try:');
      console.log('   1. Hard refresh (Ctrl+Shift+R)');
      console.log('   2. Clear browser cache');
      console.log('   3. Open in incognito/private mode');
    } else {
      console.log('❌ RATING FIX INCOMPLETE!');
      if (profile.average_rating > 0) console.log('   ❌ Average rating is still > 0');
      if (profile.rating > 0) console.log('   ❌ Old rating field is still > 0');
      if (profile.total_orders > 0) console.log('   ❌ Total orders is still > 0');
      if (reviews.length > 0) console.log('   ❌ Fake reviews still exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyRatingFix().catch(console.error);
