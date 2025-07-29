import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AdminBulkDeleteTalents] Function called');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[AdminBulkDeleteTalents] Missing environment variables');
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('[AdminBulkDeleteTalents] 🗑️ BULK DELETION: Starting to delete ALL talent data...');
    
    // Step 1: Get all talent profiles
    const { data: talents, error: talentsError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('user_type', 'companion');

    if (talentsError) {
      console.error('[AdminBulkDeleteTalents] Error fetching talents:', talentsError);
      throw talentsError;
    }

    console.log(`[AdminBulkDeleteTalents] Found ${talents?.length || 0} talents to delete`);
    
    if (!talents || talents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No talents found to delete',
          deletedCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const talentIds = talents.map(t => t.id);

    // Step 2: Delete all talent-related data from comprehensive tables
    const talentTables = [
      'talent_profile_interests',
      'service_configurations', 
      'booking_services',
      'reviews',
      'talent_reviews',
      'notification_logs',
      'availability_slots',
      'bookings',
      'transactions',
      'verification_documents'
    ];

    let deletedRecords = 0;

    for (const tableName of talentTables) {
      try {
        console.log(`[AdminBulkDeleteTalents] Cleaning table: ${tableName}`);
        
        if (tableName === 'talent_profile_interests' || tableName === 'service_configurations') {
          // These tables have talent_id column
          const { error: deleteError, count } = await supabaseAdmin
            .from(tableName)
            .delete({ count: 'exact' })
            .in('talent_id', talentIds);
          
          if (deleteError) {
            console.warn(`[AdminBulkDeleteTalents] Error cleaning ${tableName}:`, deleteError);
          } else {
            console.log(`[AdminBulkDeleteTalents] ✅ Cleaned ${tableName} (${count || 0} records)`);
            deletedRecords += count || 0;
          }
        } else {
          // Try different column names for other tables
          const possibleColumns = ['user_id', 'talent_id', 'companion_id', 'reviewer_id', 'reviewee_id'];
          
          for (const columnName of possibleColumns) {
            try {
              const { error: deleteError, count } = await supabaseAdmin
                .from(tableName)
                .delete({ count: 'exact' })
                .in(columnName, talentIds);

              if (!deleteError) {
                console.log(`[AdminBulkDeleteTalents] ✅ Cleaned ${tableName} using ${columnName} (${count || 0} records)`);
                deletedRecords += count || 0;
                break; // Success, move to next table
              }
            } catch (colError) {
              // Column doesn't exist, try next column
              continue;
            }
          }
        }
      } catch (tableError) {
        console.warn(`[AdminBulkDeleteTalents] Failed to clean ${tableName}:`, tableError);
      }
    }

    // Step 3: Clean storage buckets
    try {
      console.log('[AdminBulkDeleteTalents] Cleaning verification-documents bucket...');
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('verification-documents')
        .list('', { limit: 1000 });

      if (!listError && files && files.length > 0) {
        // Filter files that belong to talents
        const talentFiles = files.filter(file => 
          talentIds.some(talentId => 
            file.name.includes(talentId) || 
            file.name.startsWith(talentId.slice(0, 8)) ||
            file.name.includes(talentId.slice(0, 12))
          )
        );

        if (talentFiles.length > 0) {
          const filePaths = talentFiles.map(file => file.name);
          console.log(`[AdminBulkDeleteTalents] Found ${filePaths.length} talent files to delete`);
          
          const { error: deleteFilesError } = await supabaseAdmin.storage
            .from('verification-documents')
            .remove(filePaths);

          if (!deleteFilesError) {
            console.log('[AdminBulkDeleteTalents] ✅ Storage files cleaned');
          } else {
            console.warn('[AdminBulkDeleteTalents] Storage cleanup error:', deleteFilesError);
          }
        }
      }
    } catch (storageError) {
      console.warn('[AdminBulkDeleteTalents] Storage cleanup failed (non-critical):', storageError);
    }

    // Step 4: Delete all talent profiles
    const { error: profilesDeleteError, count: profilesCount } = await supabaseAdmin
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('user_type', 'companion');

    if (profilesDeleteError) {
      console.error('[AdminBulkDeleteTalents] Error deleting talent profiles:', profilesDeleteError);
      throw profilesDeleteError;
    }

    console.log(`[AdminBulkDeleteTalents] ✅ Deleted ${profilesCount || 0} talent profiles`);

    // Step 5: Delete from auth.users for each talent
    let authDeletedCount = 0;
    for (const talent of talents) {
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(talent.id);
        if (!authDeleteError) {
          authDeletedCount++;
        } else {
          console.warn(`[AdminBulkDeleteTalents] Auth deletion failed for ${talent.email}:`, authDeleteError);
        }
      } catch (authError) {
        console.warn(`[AdminBulkDeleteTalents] Auth deletion error for ${talent.email}:`, authError);
      }
    }

    console.log(`[AdminBulkDeleteTalents] ✅ Deleted ${authDeletedCount} auth users`);

    const summary = {
      success: true,
      message: `Successfully deleted all talent data`,
      deletedTalents: talents.length,
      deletedProfiles: profilesCount || 0,
      deletedAuthUsers: authDeletedCount,
      deletedRelatedRecords: deletedRecords,
      talentNames: talents.map(t => t.name || t.email).slice(0, 10) // Show first 10 names
    };

    console.log('[AdminBulkDeleteTalents] ✅ Bulk deletion completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[AdminBulkDeleteTalents] ❌ Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Check function logs for more details'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
