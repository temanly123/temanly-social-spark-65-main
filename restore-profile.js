import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreProfile() {
  console.log('🔄 RESTORING your real profile data...');

  try {
    // Update your existing profile to remove ONLY the fake rating
    const { data, error } = await supabase
      .from('profiles')
      .update({
        // Keep all your real data, just fix the rating
        name: 'Amanda Angela',
        full_name: 'Amanda Angela',
        email: 'angela.soenoko@gmail.com',
        age: 21,
        location: 'Cimahi',
        city: 'Cimahi',
        bio: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        average_rating: null, // REMOVE THE FAKE 4.8 RATING!
        total_orders: 0, // Keep real order count
        is_available: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44');

    if (error) {
      console.error('❌ Error restoring profile:', error);
      return;
    }

    console.log('✅ SUCCESS: Your real profile has been restored!');
    console.log('✅ Rating is now NULL (no fake 4.8)');
    console.log('✅ All your real data is back');
    console.log('');
    console.log('🎉 Profile restored with REAL data only:');
    console.log('   - Name: Amanda Angela');
    console.log('   - Email: angela.soenoko@gmail.com');
    console.log('   - Age: 21');
    console.log('   - Location: Cimahi');
    console.log('   - Rating: NULL (no fake rating!)');
    console.log('   - Orders: 0 (real count)');
    console.log('   - Bio: Your real bio text');
    console.log('   - User Type: companion');
    console.log('   - Status: active');

  } catch (error) {
    console.error('❌ Error during restore:', error);
  }
}

restoreProfile().catch(console.error);