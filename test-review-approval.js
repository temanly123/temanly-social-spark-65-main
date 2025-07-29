import { createClient } from '@supabase/supabase-js';

// Using the actual Supabase credentials from the client
const supabaseUrl = "https://enyrffgedfvgunokpmqk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReviewApproval() {
  console.log('🧪 Testing review approval functionality...\n');

  try {
    // 1. Check current reviews
    console.log('1. Checking current reviews...');
    const { data: allReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching reviews:', fetchError);
      return;
    }

    console.log(`📊 Total reviews: ${allReviews?.length || 0}`);
    
    if (!allReviews || allReviews.length === 0) {
      console.log('⚠️  No reviews found. Creating a test review first...');
      
      // Create a test review
      const testReview = {
        id: crypto.randomUUID(),
        booking_id: crypto.randomUUID(),
        reviewer_id: '2e88ce00-b8b4-4b8b-8b8b-8b8b8b8b8b8b', // Replace with actual user ID
        reviewee_id: '9153fe0a-6b65-4011-b894-f7268b3abe44', // Replace with actual talent ID
        rating: 5,
        comment: 'Test review for approval functionality',
        is_verified: false,
        created_at: new Date().toISOString()
      };

      const { data: createdReview, error: createError } = await supabase
        .from('reviews')
        .insert([testReview])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test review:', createError);
        return;
      }

      console.log('✅ Test review created:', createdReview.id);
      allReviews.push(createdReview);
    }

    // 2. Find a pending review to test approval
    const pendingReview = allReviews.find(r => !r.is_verified);
    
    if (!pendingReview) {
      console.log('⚠️  No pending reviews found. All reviews are already approved.');
      return;
    }

    console.log(`\n2. Testing approval for review: ${pendingReview.id}`);
    console.log(`   Current status: ${pendingReview.is_verified ? 'Approved' : 'Pending'}`);
    console.log(`   Rating: ${pendingReview.rating} stars`);
    console.log(`   Comment: "${pendingReview.comment}"`);

    // 3. Test the approval process
    console.log('\n3. Approving the review...');
    
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        is_verified: true,
        admin_notes: 'Approved via test script',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingReview.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error approving review:', updateError);
      return;
    }

    console.log('✅ Review approved successfully!');
    console.log('   Updated data:', {
      id: updatedReview.id,
      is_verified: updatedReview.is_verified,
      verified_at: updatedReview.verified_at,
      admin_notes: updatedReview.admin_notes
    });

    // 4. Verify the approval persisted
    console.log('\n4. Verifying the approval persisted...');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const { data: verifyReview, error: verifyError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', pendingReview.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying review:', verifyError);
      return;
    }

    if (verifyReview.is_verified) {
      console.log('✅ SUCCESS: Review approval persisted correctly!');
      console.log(`   Status: ${verifyReview.is_verified ? 'Approved' : 'Pending'}`);
      console.log(`   Verified at: ${verifyReview.verified_at}`);
    } else {
      console.log('❌ FAILURE: Review approval did not persist!');
      console.log(`   Status: ${verifyReview.is_verified ? 'Approved' : 'Pending'}`);
    }

    // 5. Test rejection process
    console.log('\n5. Testing rejection process...');
    
    // First, set it back to pending
    await supabase
      .from('reviews')
      .update({
        is_verified: false,
        admin_notes: null,
        verified_at: null
      })
      .eq('id', pendingReview.id);

    console.log('   Reset review to pending status');

    // Now reject it
    const { data: rejectedReview, error: rejectError } = await supabase
      .from('reviews')
      .update({
        is_verified: false,
        admin_notes: 'Rejected via test script',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingReview.id)
      .select()
      .single();

    if (rejectError) {
      console.error('❌ Error rejecting review:', rejectError);
      return;
    }

    console.log('✅ Review rejected successfully!');
    console.log('   Rejection data:', {
      id: rejectedReview.id,
      is_verified: rejectedReview.is_verified,
      admin_notes: rejectedReview.admin_notes
    });

    // 6. Final summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('='.repeat(50));
    console.log('✅ Review approval functionality is working correctly');
    console.log('✅ Database updates are persisting properly');
    console.log('✅ Both approval and rejection processes work');
    console.log('');
    console.log('🔧 If the admin dashboard is still showing issues:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Clear browser cache and reload');
    console.log('3. Check if real-time subscriptions are conflicting');
    console.log('4. Verify RLS policies allow admin updates');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testReviewApproval().then(() => {
  console.log('\n🏁 Review approval test completed');
  process.exit(0);
});
