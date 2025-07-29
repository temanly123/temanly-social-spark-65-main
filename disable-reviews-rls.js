import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA1OTcyNjQsImV4cCI6MjAzNjE3MzI2NH0.VKWOBt_U9AJJnQgsOYJvVhBJbVfzQJXJQJXJQJXJQJX';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReviewsAccess() {
  console.log('🧪 Testing reviews table access...');

  try {
    // Test if we can read from reviews table
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error reading reviews:', error);
    } else {
      console.log('✅ Successfully read reviews:', data);
    }

    // Test if we can insert a test review
    const testReview = {
      booking_id: '123e4567-e89b-12d3-a456-426614174000', // dummy UUID
      reviewer_id: '123e4567-e89b-12d3-a456-426614174001', // dummy UUID
      reviewee_id: '123e4567-e89b-12d3-a456-426614174002', // dummy UUID
      rating: 5,
      comment: 'Test review',
      is_verified: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('reviews')
      .insert([testReview])
      .select();

    if (insertError) {
      console.error('❌ Error inserting test review:', insertError);
    } else {
      console.log('✅ Successfully inserted test review:', insertData);
      
      // Clean up - delete the test review
      if (insertData && insertData[0]) {
        await supabase
          .from('reviews')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Cleaned up test review');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testReviewsAccess().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
});
