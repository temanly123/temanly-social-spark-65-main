import { supabase } from '@/integrations/supabase/client';

export async function cleanupFakeReviewsDirectly() {
  console.log('🧹 Starting direct fake review cleanup...');
  
  try {
    let totalDeleted = 0;

    // 1. Delete reviews for Amanda Angela Soenoko specifically
    console.log('🎯 Deleting reviews for Amanda Angela Soenoko...');
    const { data: amandaReviews, error: amandaError } = await supabase
      .from('reviews')
      .delete()
      .in('talent_id', [
        '9153feb4-6b65-4011-b894-f7268b3abe44' // Amanda's ID
      ])
      .select('id');

    if (amandaError) {
      console.error('Error deleting Amanda reviews:', amandaError);
    } else {
      const amandaCount = amandaReviews?.length || 0;
      totalDeleted += amandaCount;
      console.log(`✅ Deleted ${amandaCount} reviews for Amanda`);
    }

    // 2. Delete reviews by demo user IDs
    console.log('👥 Deleting reviews by demo users...');
    const demoUserIds = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005'
    ];

    const { data: demoUserReviews, error: demoUserError } = await supabase
      .from('reviews')
      .delete()
      .in('user_id', demoUserIds)
      .select('id');

    if (demoUserError) {
      console.error('Error deleting demo user reviews:', demoUserError);
    } else {
      const demoUserCount = demoUserReviews?.length || 0;
      totalDeleted += demoUserCount;
      console.log(`✅ Deleted ${demoUserCount} reviews by demo users`);
    }

    // 3. Get mock talent IDs and delete their reviews
    console.log('🎭 Finding and deleting mock talent reviews...');
    const mockEmails = [
      'maya.sari@temanly.com',
      'rina.putri@temanly.com', 
      'sari.indah@temanly.com',
      'dina.cantik@temanly.com',
      'luna.manis@temanly.com',
      'demo@temanly.com',
      'user@demo.com', 
      'test@test.com'
    ];

    const mockNames = [
      'Maya Sari', 'Rina Putri', 'Sari Indah', 'Dina Cantik', 'Luna Manis',
      'Sarah Michelle', 'Amanda Rose', 'Jessica Liu', 'Sari Dewi', 'Amanda Fitri'
    ];

    // Get mock talent IDs
    const { data: mockTalents } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.in.(${mockEmails.map(e => `"${e}"`).join(',')}),name.in.(${mockNames.map(n => `"${n}"`).join(',')})`);

    const mockTalentIds = mockTalents?.map(t => t.id) || [];
    console.log(`Found ${mockTalentIds.length} mock talent profiles`);

    if (mockTalentIds.length > 0) {
      const { data: mockTalentReviews, error: mockTalentError } = await supabase
        .from('reviews')
        .delete()
        .in('talent_id', mockTalentIds)
        .select('id');

      if (mockTalentError) {
        console.error('Error deleting mock talent reviews:', mockTalentError);
      } else {
        const mockTalentCount = mockTalentReviews?.length || 0;
        totalDeleted += mockTalentCount;
        console.log(`✅ Deleted ${mockTalentCount} reviews for mock talents`);
      }
    }

    // 4. Delete reviews with specific demo content patterns
    console.log('📝 Deleting reviews with demo content...');
    const demoPatterns = [
      '%Sari sangat membantu%',
      '%Content creation tips%',
      '%Great conversation partner%',
      '%Sari is amazing%',
      '%Enjoyed our museum date%',
      '%demo%',
      '%test%',
      '%sample%'
    ];

    for (const pattern of demoPatterns) {
      const { data: patternReviews, error: patternError } = await supabase
        .from('reviews')
        .delete()
        .ilike('review_text', pattern)
        .select('id');

      if (patternError) {
        console.error(`Error deleting reviews with pattern ${pattern}:`, patternError);
      } else {
        const patternCount = patternReviews?.length || 0;
        totalDeleted += patternCount;
        if (patternCount > 0) {
          console.log(`✅ Deleted ${patternCount} reviews with pattern: ${pattern}`);
        }
      }
    }

    // 5. Check remaining reviews
    const { count: remainingCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    console.log(`🎉 Cleanup complete! Deleted ${totalDeleted} fake reviews. ${remainingCount || 0} reviews remaining.`);
    
    return {
      success: true,
      deletedCount: totalDeleted,
      remainingCount: remainingCount || 0,
      message: `Successfully deleted ${totalDeleted} fake reviews`
    };

  } catch (error) {
    console.error('❌ Direct cleanup failed:', error);
    return {
      success: false,
      deletedCount: 0,
      remainingCount: 0,
      message: `Cleanup failed: ${error}`
    };
  }
}
