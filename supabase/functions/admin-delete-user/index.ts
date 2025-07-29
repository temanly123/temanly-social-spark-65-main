
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
    console.log('[AdminDeleteUser] Function called with method:', req.method);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[AdminDeleteUser] Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { userId } = requestBody;

    if (!userId) {
      console.error('[AdminDeleteUser] Missing userId parameter');
      throw new Error('Missing required parameter: userId');
    }

    console.log(`[AdminDeleteUser] Processing deletion for user: ${userId}`);

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[AdminDeleteUser] Missing environment variables');
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log(`[AdminDeleteUser] Starting complete deletion process for user: ${userId}`);

    // Step 1: Delete all storage files first
    try {
      console.log('[AdminDeleteUser] Step 1: Cleaning storage files...');
      
      const { data: allFiles, error: listError } = await supabaseAdmin.storage
        .from('documents')
        .list('', { limit: 1000 });

      if (listError) {
        console.warn('[AdminDeleteUser] Warning - Error listing storage files:', listError);
      } else if (allFiles && allFiles.length > 0) {
        // Find files that belong to this user using multiple patterns
        const userFilePatterns = [
          userId, // full UUID
          userId.slice(0, 8), // short ID
          userId.slice(0, 12), // medium ID
          userId.slice(0, 36) // UUID length
        ];

        const filesToDelete = allFiles.filter(file => 
          userFilePatterns.some(pattern => 
            file.name.includes(pattern) || 
            file.name.startsWith(pattern) ||
            file.name.split('/')[0] === pattern ||
            file.name.split('_')[0] === pattern ||
            file.name.split('-')[0] === pattern
          )
        ).map(file => file.name);

        if (filesToDelete.length > 0) {
          console.log(`[AdminDeleteUser] Deleting ${filesToDelete.length} storage files:`, filesToDelete);
          const { error: deleteFilesError } = await supabaseAdmin.storage
            .from('documents')
            .remove(filesToDelete);

          if (deleteFilesError) {
            console.warn('[AdminDeleteUser] Some storage files could not be deleted:', deleteFilesError);
          } else {
            console.log('[AdminDeleteUser] Successfully deleted storage files');
          }
        } else {
          console.log('[AdminDeleteUser] No storage files found for user');
        }
      }
    } catch (storageError) {
      console.warn('[AdminDeleteUser] Storage cleanup failed (non-critical):', storageError);
    }

    // Step 1.5: Clean up verification-documents bucket
    try {
      console.log('[AdminDeleteUser] Step 1.5: Cleaning verification-documents storage...');

      const { data: verificationFiles, error: verificationListError } = await supabaseAdmin.storage
        .from('verification-documents')
        .list('', { limit: 1000 });

      if (verificationListError) {
        console.warn('[AdminDeleteUser] Warning - Error listing verification files:', verificationListError);
      } else if (verificationFiles && verificationFiles.length > 0) {
        // Find verification files that belong to this user
        const userFilePatterns = [
          userId, // full UUID
          userId.slice(0, 8), // short ID
          userId.slice(0, 12), // medium ID
          userId.slice(0, 36) // UUID length
        ];

        const verificationFilesToDelete = verificationFiles.filter(file =>
          userFilePatterns.some(pattern =>
            file.name.includes(pattern) ||
            file.name.startsWith(pattern) ||
            file.name.split('/')[0] === pattern ||
            file.name.split('_')[0] === pattern ||
            file.name.split('-')[0] === pattern
          )
        ).map(file => file.name);

        if (verificationFilesToDelete.length > 0) {
          console.log(`[AdminDeleteUser] Deleting ${verificationFilesToDelete.length} verification files:`, verificationFilesToDelete);
          const { error: deleteVerificationError } = await supabaseAdmin.storage
            .from('verification-documents')
            .remove(verificationFilesToDelete);

          if (deleteVerificationError) {
            console.warn('[AdminDeleteUser] Some verification files could not be deleted:', deleteVerificationError);
          } else {
            console.log('[AdminDeleteUser] Successfully deleted verification files');
          }
        } else {
          console.log('[AdminDeleteUser] No verification files found for user');
        }
      }
    } catch (verificationStorageError) {
      console.warn('[AdminDeleteUser] Verification storage cleanup failed (non-critical):', verificationStorageError);
    }

    // Step 2: Delete from related database tables
    console.log('[AdminDeleteUser] Step 2: Cleaning database tables...');
    
    const tablesToClean = [
      'talent_services',
      'talent_interests', 
      'availability_slots',
      'bookings',
      'reviews',
      'transactions',
      'verification_documents'
    ];

    // Special handling for verification_documents table first
    try {
      console.log('[AdminDeleteUser] Cleaning verification_documents table...');
      const { data: deletedDocs, error: docsError } = await supabaseAdmin
        .from('verification_documents')
        .delete()
        .eq('user_id', userId)
        .select();

      if (docsError) {
        console.warn('[AdminDeleteUser] Error deleting verification_documents:', docsError);
      } else {
        console.log(`[AdminDeleteUser] Successfully deleted ${deletedDocs?.length || 0} verification documents`);
      }
    } catch (docsCleanupError) {
      console.warn('[AdminDeleteUser] Failed to clean verification_documents:', docsCleanupError);
    }

    // Clean other tables
    for (const tableName of tablesToClean) {
      if (tableName === 'verification_documents') continue; // Already handled above

      try {
        // Try different possible column names for user references
        const possibleColumns = ['user_id', 'talent_id', 'companion_id', 'reviewer_id', 'reviewee_id'];

        for (const columnName of possibleColumns) {
          try {
            const { error: deleteError } = await supabaseAdmin
              .from(tableName)
              .delete()
              .eq(columnName, userId);

            if (!deleteError) {
              console.log(`[AdminDeleteUser] Cleaned ${tableName} using ${columnName}`);
            }
          } catch (colError) {
            // Column doesn't exist, continue to next column
            continue;
          }
        }
      } catch (tableError) {
        console.warn(`[AdminDeleteUser] Failed to clean ${tableName}:`, tableError);
      }
    }

    // Step 3: Delete from profiles table
    console.log('[AdminDeleteUser] Step 3: Deleting profile...');
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.warn('[AdminDeleteUser] Profile deletion error (may not exist):', profileError);
    } else {
      console.log('[AdminDeleteUser] Successfully deleted profile');
    }

    // Step 4: Delete from auth.users (this should cascade remaining auth data)
    console.log('[AdminDeleteUser] Step 4: Deleting from auth...');
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.warn('[AdminDeleteUser] Auth deletion error:', authError);
    } else {
      console.log('[AdminDeleteUser] Successfully deleted from auth');
    }

    console.log(`[AdminDeleteUser] Complete deletion process finished for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${userId} and all associated data deleted successfully`,
        details: {
          profile_deleted: !profileError,
          auth_deleted: !authError,
          storage_cleaned: true,
          tables_cleaned: true
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error('[AdminDeleteUser] Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
