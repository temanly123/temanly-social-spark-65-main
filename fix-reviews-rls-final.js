import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDU5NzI2NCwiZXhwIjoyMDM2MTczMjY0fQ.VKWOBt_U9AJJnQgsOYJvVhBJbVfzQJXJQJXJQJXJQJX';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixReviewsRLS() {
  console.log('🔧 Fixing reviews table RLS policies...');

  try {
    // Drop existing policies that might be using wrong field names
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
      DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
      DROP POLICY IF EXISTS "Talents can view their reviews" ON reviews;
      DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
      DROP POLICY IF EXISTS "Users can view verified reviews" ON reviews;
      DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
      DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
    `;

    console.log('📝 Dropping existing policies...');
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      console.log('⚠️ Drop policies error (might be expected):', dropError.message);
    }

    // Create correct policies using actual field names (reviewer_id, reviewee_id, comment)
    const createPolicies = `
      -- Create correct policies using actual field names
      CREATE POLICY "Users can create reviews for their bookings" ON reviews
      FOR INSERT WITH CHECK (reviewer_id = auth.uid());

      CREATE POLICY "Users can view verified reviews" ON reviews
      FOR SELECT USING (is_verified = true);

      CREATE POLICY "Users can view their own reviews" ON reviews
      FOR SELECT USING (reviewer_id = auth.uid());

      CREATE POLICY "Talents can view their reviews" ON reviews
      FOR SELECT USING (reviewee_id = auth.uid());

      CREATE POLICY "Admins can manage all reviews" ON reviews
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() AND user_type = 'admin'
          )
      );
    `;

    console.log('✅ Creating new policies with correct field names...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    if (createError) {
      console.error('❌ Create policies error:', createError);
      return;
    }

    // Ensure RLS is enabled and grant permissions
    const finalSetup = `
      -- Ensure RLS is enabled
      ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

      -- Grant necessary permissions
      GRANT ALL ON reviews TO authenticated;
      GRANT ALL ON reviews TO service_role;
    `;

    console.log('🔐 Enabling RLS and setting permissions...');
    const { error: setupError } = await supabase.rpc('exec_sql', { sql: finalSetup });
    if (setupError) {
      console.log('⚠️ Setup error (might be expected):', setupError.message);
    }

    console.log('🎉 Reviews RLS policies fixed successfully!');
    console.log('✅ Now using correct field names: reviewer_id, reviewee_id, comment');

  } catch (error) {
    console.error('❌ Error fixing reviews RLS:', error);
  }
}

// Alternative approach: Direct SQL execution
async function fixReviewsRLSDirect() {
  console.log('🔧 Fixing reviews RLS with direct SQL approach...');

  const sql = `
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
    DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
    DROP POLICY IF EXISTS "Talents can view their reviews" ON reviews;
    DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

    -- Create correct policies
    CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

    CREATE POLICY "Public can view verified reviews" ON reviews
    FOR SELECT TO authenticated, anon
    USING (is_verified = true);

    CREATE POLICY "Users can view own reviews" ON reviews
    FOR SELECT TO authenticated
    USING (reviewer_id = auth.uid());

    CREATE POLICY "Talents can view their reviews" ON reviews
    FOR SELECT TO authenticated
    USING (reviewee_id = auth.uid());

    -- Enable RLS
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('❌ Direct SQL error:', error);
    } else {
      console.log('✅ Direct SQL execution successful!');
    }
  } catch (error) {
    console.error('❌ Error with direct SQL:', error);
  }
}

// Run the fix
fixReviewsRLSDirect().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
});
