import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalRatingFix() {
  console.log('🔧 Final rating fix for Amanda...');
  
  try {
    // Update Amanda's profile with correct ID and reset all rating fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        average_rating: 0.0,
        rating: 0.0,
        total_orders: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44');
      
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }
    
    console.log('✅ Profile updated successfully!');
    
    // Verify the update
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, average_rating, rating, total_orders')
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44')
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching updated profile:', fetchError);
      return;
    }
    
    console.log('📋 Updated Profile Data:');
    console.log('   - Name:', profile.name);
    console.log('   - Average Rating:', profile.average_rating);
    console.log('   - Rating (old field):', profile.rating);
    console.log('   - Total Orders:', profile.total_orders);
    
    // Also check for any remaining reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', '9153fe0a-6b65-4011-b894-f7568b8abe44');
      
    if (!reviewsError) {
      console.log('📝 Reviews found:', reviews.length);
      if (reviews.length > 0) {
        console.log('⚠️  WARNING: There are still reviews in the database!');
        reviews.forEach((review, index) => {
          console.log(`   - Review ${index + 1}: Rating ${review.rating}`);
        });
      }
    }
    
    console.log('');
    console.log('✅ Final rating fix completed!');
    console.log('🔄 Please refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

finalRatingFix().catch(console.error);
