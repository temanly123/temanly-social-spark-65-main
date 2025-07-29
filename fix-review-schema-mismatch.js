const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixReviewSchemaMismatch() {
  console.log('🔧 Starting review schema mismatch fix...');

  try {
    // 1. First, check the current schema
    console.log('1. Checking current reviews table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'reviews' 
          ORDER BY ordinal_position;
        `
      });

    if (schemaError) {
      console.error('❌ Schema check error:', schemaError);
      return;
    }

    console.log('📋 Current schema:', schemaData);

    // 2. Check if we need to rename columns
    const hasReviewerIdColumn = schemaData?.some(col => col.column_name === 'reviewer_id');
    const hasUserIdColumn = schemaData?.some(col => col.column_name === 'user_id');
    const hasCommentColumn = schemaData?.some(col => col.column_name === 'comment');
    const hasReviewTextColumn = schemaData?.some(col => col.column_name === 'review_text');

    console.log('🔍 Column analysis:');
    console.log('   - Has reviewer_id:', hasReviewerIdColumn);
    console.log('   - Has user_id:', hasUserIdColumn);
    console.log('   - Has comment:', hasCommentColumn);
    console.log('   - Has review_text:', hasReviewTextColumn);

    // 3. Standardize to the TypeScript schema (reviewer_id, reviewee_id, comment)
    let alterSql = '';

    if (hasUserIdColumn && !hasReviewerIdColumn) {
      alterSql += 'ALTER TABLE reviews RENAME COLUMN user_id TO reviewer_id;\n';
      console.log('📝 Will rename user_id to reviewer_id');
    }

    if (!schemaData?.some(col => col.column_name === 'reviewee_id') && 
        schemaData?.some(col => col.column_name === 'talent_id')) {
      alterSql += 'ALTER TABLE reviews RENAME COLUMN talent_id TO reviewee_id;\n';
      console.log('📝 Will rename talent_id to reviewee_id');
    }

    if (hasReviewTextColumn && !hasCommentColumn) {
      alterSql += 'ALTER TABLE reviews RENAME COLUMN review_text TO comment;\n';
      console.log('📝 Will rename review_text to comment');
    }

    // 4. Execute the schema changes
    if (alterSql) {
      console.log('🔄 Executing schema changes...');
      const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterSql });
      
      if (alterError) {
        console.error('❌ Schema alteration error:', alterError);
        return;
      }
      console.log('✅ Schema changes completed successfully!');
    } else {
      console.log('✅ Schema is already correct!');
    }

    // 5. Update RLS policies to match the correct schema
    console.log('🔐 Updating RLS policies...');
    const rlsSql = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
      DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
      DROP POLICY IF EXISTS "Talents can view their reviews" ON reviews;
      DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
      DROP POLICY IF EXISTS "Users can view verified reviews" ON reviews;
      DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
      DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
      DROP POLICY IF EXISTS "Public can view verified reviews" ON reviews;
      DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
      DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;

      -- Create correct policies using reviewer_id, reviewee_id, comment
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

      CREATE POLICY "Admins can manage all reviews" ON reviews
      FOR ALL TO authenticated
      USING (
          EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() AND user_type = 'admin'
          )
      )
      WITH CHECK (
          EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() AND user_type = 'admin'
          )
      );

      -- Ensure RLS is enabled
      ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

      -- Grant necessary permissions
      GRANT ALL ON reviews TO authenticated;
      GRANT ALL ON reviews TO service_role;
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });
    if (rlsError) {
      console.error('❌ RLS update error:', rlsError);
      return;
    }

    console.log('✅ RLS policies updated successfully!');

    // 6. Test the fix by fetching reviews
    console.log('🧪 Testing review fetch...');
    const { data: testReviews, error: testError } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(name),
        reviewee:profiles!reviewee_id(name)
      `)
      .limit(5);

    if (testError) {
      console.error('❌ Test fetch error:', testError);
    } else {
      console.log(`✅ Successfully fetched ${testReviews?.length || 0} reviews!`);
      if (testReviews && testReviews.length > 0) {
        console.log('📋 Sample review:', {
          id: testReviews[0].id,
          rating: testReviews[0].rating,
          reviewer: testReviews[0].reviewer?.name,
          reviewee: testReviews[0].reviewee?.name,
          is_verified: testReviews[0].is_verified
        });
      }
    }

    console.log('🎉 Review schema mismatch fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixReviewSchemaMismatch().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
});
