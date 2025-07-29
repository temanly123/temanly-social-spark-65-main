import { supabase } from '@/integrations/supabase/client';

export async function cleanupDuplicateProfiles() {
  console.log('🧹 Starting duplicate profile cleanup...');
  
  try {
    // Get all companion profiles
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'companion')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return { success: false, error: error.message };
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.log('ℹ️ No companion profiles found');
      return { success: true, message: 'No profiles to clean up' };
    }

    // Group profiles by email
    const profilesByEmail: { [email: string]: any[] } = {};
    allProfiles.forEach(profile => {
      if (!profilesByEmail[profile.email]) {
        profilesByEmail[profile.email] = [];
      }
      profilesByEmail[profile.email].push(profile);
    });

    // Find duplicates
    const duplicateEmails = Object.keys(profilesByEmail).filter(
      email => profilesByEmail[email].length > 1
    );

    if (duplicateEmails.length === 0) {
      console.log('✅ No duplicate profiles found');
      return { success: true, message: 'No duplicates found' };
    }

    console.log(`🔍 Found ${duplicateEmails.length} emails with duplicates:`);
    
    let totalDeleted = 0;
    const results: string[] = [];

    for (const email of duplicateEmails) {
      const profiles = profilesByEmail[email];
      console.log(`\n📧 Processing ${email} (${profiles.length} entries):`);
      
      profiles.forEach((profile, i) => {
        console.log(`   ${i + 1}. ID: ${profile.id}`);
        console.log(`      Name: ${profile.name}`);
        console.log(`      Created: ${profile.created_at}`);
        console.log(`      Services: ${JSON.stringify(profile.profile_data?.available_services)}`);
      });

      // Keep the profile with the most complete data
      // Priority: 1) Has services data, 2) Most recent, 3) Specific ID for Amanda
      let keepProfile = profiles[0];
      
      // Special case for Amanda - keep the specific ID
      if (email === 'angela.soenoko@gmail.com') {
        const amandaProfile = profiles.find(p => p.id === '9153fe0a-6b65-4011-b894-f7568b8abe44');
        if (amandaProfile) {
          keepProfile = amandaProfile;
        }
      } else {
        // For others, keep the one with most complete data
        keepProfile = profiles.reduce((best, current) => {
          const bestServices = best.profile_data?.available_services?.length || 0;
          const currentServices = current.profile_data?.available_services?.length || 0;
          
          if (currentServices > bestServices) return current;
          if (currentServices === bestServices && new Date(current.created_at) > new Date(best.created_at)) {
            return current;
          }
          return best;
        });
      }

      console.log(`✅ Keeping profile: ${keepProfile.id} (${keepProfile.name})`);

      // Delete the duplicates
      const toDelete = profiles.filter(p => p.id !== keepProfile.id);
      
      for (const duplicate of toDelete) {
        console.log(`🗑️ Deleting duplicate: ${duplicate.id}`);
        
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', duplicate.id);

        if (deleteError) {
          console.error(`❌ Error deleting ${duplicate.id}:`, deleteError);
          results.push(`❌ Failed to delete ${duplicate.name} (${duplicate.id}): ${deleteError.message}`);
        } else {
          console.log(`✅ Deleted ${duplicate.id}`);
          totalDeleted++;
          results.push(`✅ Deleted duplicate ${duplicate.name} (${duplicate.id})`);
        }
      }
    }

    console.log(`\n🎉 Cleanup completed! Deleted ${totalDeleted} duplicate profiles.`);
    
    return {
      success: true,
      message: `Cleanup completed. Deleted ${totalDeleted} duplicate profiles.`,
      details: results
    };

  } catch (error: any) {
    console.error('❌ Unexpected error during cleanup:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error occurred'
    };
  }
}

// Function to fix Amanda's data format specifically
export async function fixAmandaDataFormat() {
  console.log('🔧 Fixing Amanda data format...');
  
  try {
    const { data: amanda, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44')
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching Amanda:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!amanda) {
      console.log('ℹ️ Amanda profile not found');
      return { success: false, error: 'Amanda profile not found' };
    }

    // Fix the services format - convert from formatted strings to simple arrays
    const fixedProfileData = {
      ...amanda.profile_data,
      available_services: ['chat', 'call', 'video_call', 'offline_date', 'party_buddy'],
      interests: ['Sushi Date', 'Movie Date', 'Shopping', 'Karaoke', 'Beach Walk']
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_data: fixedProfileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44');
      
    if (updateError) {
      console.error('❌ Error updating Amanda:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Fixed Amanda data format');
    return { success: true, message: 'Amanda data format fixed successfully' };

  } catch (error: any) {
    console.error('❌ Unexpected error fixing Amanda data:', error);
    return { success: false, error: error.message || 'Unexpected error occurred' };
  }
}
