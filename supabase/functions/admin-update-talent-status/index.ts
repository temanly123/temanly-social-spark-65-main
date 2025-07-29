
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { talentId, approved, rejectionReason } = await req.json();

    if (!talentId || typeof approved !== 'boolean') {
      throw new Error('Missing required parameters: talentId and approved');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const verificationStatus = approved ? 'verified' : 'rejected';
    const profileStatus = approved ? 'active' : 'suspended';

    console.log(`[AdminUpdateTalentStatus] Processing ${approved ? 'approval' : 'rejection'} for talent:`, talentId);

    // Begin transaction-like operations
    try {
      // 1. Update the profile with admin privileges and ensure all required fields are set
      const updateData: any = {
        verification_status: verificationStatus,
        status: profileStatus,
        updated_at: new Date().toISOString()
      };

      // If approving, ensure all required fields for frontend display are set
      if (approved) {
        // First, get the current profile to check existing values
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', talentId)
          .single();

        // Ensure user_type is set correctly
        updateData.user_type = 'companion';

        // Ensure all required fields for Browse Talents display
        if (!currentProfile?.name) updateData.name = currentProfile?.full_name || 'Unknown Talent';
        if (!currentProfile?.age) updateData.age = 25;
        if (!currentProfile?.location && !currentProfile?.city) updateData.location = 'Jakarta';
        if (!currentProfile?.bio) updateData.bio = 'Professional companion available for various services.';
        if (!currentProfile?.profile_image) updateData.profile_image = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face';

        // Set talent-specific defaults if fields are null/undefined
        if (!currentProfile?.talent_level) updateData.talent_level = 'fresh';
        // DO NOT set fake ratings - let ratings be calculated from real reviews only
        // if (!currentProfile?.average_rating) updateData.average_rating = 4.5; // REMOVED - no fake ratings!
        if (!currentProfile?.total_orders) updateData.total_orders = 0;
        if (currentProfile?.is_available === null || currentProfile?.is_available === undefined) updateData.is_available = true;
        if (currentProfile?.is_newcomer === null || currentProfile?.is_newcomer === undefined) updateData.is_newcomer = true;
        if (currentProfile?.featured_talent === null || currentProfile?.featured_talent === undefined) updateData.featured_talent = false;

        // Ensure basic services are available if not set or empty
        if (!currentProfile?.available_services || currentProfile.available_services.length === 0) {
          updateData.available_services = ['chat', 'call', 'video', 'offline-date'];
        }

        // Set default interests if not set or empty
        if (!currentProfile?.interests || currentProfile.interests.length === 0) {
          updateData.interests = ['Conversation', 'Entertainment', 'Companionship'];
        }

        // Set default rent_lover_rate if not set
        if (!currentProfile?.rent_lover_rate) {
          updateData.rent_lover_rate = 65000.00; // Default rate for fresh talent
        }
      }

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', talentId)
        .select();

      if (profileError) {
        console.error('[AdminUpdateTalentStatus] Error updating profile:', profileError);
        throw profileError;
      }

      // 2. If approved, initialize talent level as Fresh Talent
      if (approved) {
        const { error: levelError } = await supabaseAdmin
          .from('talent_levels')
          .upsert({
            talent_id: talentId,
            current_level: 'fresh',
            total_orders: 0,
            average_rating: 0,
            months_active: 0,
            level_updated_at: new Date().toISOString()
          });

        if (levelError) {
          console.warn('[AdminUpdateTalentStatus] Error initializing talent level:', levelError);
        }

        // 3. Create initial service availability entries
        const defaultServices = ['chat', 'call', 'video_call', 'offline_date', 'rent_a_lover'];
        const serviceAvailability = defaultServices.map(service => ({
          talent_id: talentId,
          service_type: service,
          available: true,
          custom_rate: null,
          created_at: new Date().toISOString()
        }));

        const { error: servicesError } = await supabaseAdmin
          .from('talent_service_availability')
          .upsert(serviceAvailability);

        if (servicesError) {
          console.warn('[AdminUpdateTalentStatus] Error initializing service availability:', servicesError);
        }
      }

      console.log('[AdminUpdateTalentStatus] Successfully updated talent:', profileData);

      // 4. Send notification via WhatsApp/Email
      try {
        const notificationResult = await supabaseAdmin.functions.invoke('send-approval-notification', {
          body: { 
            userId: talentId, 
            approved,
            rejectionReason: rejectionReason || null,
            userType: 'talent'
          }
        });
        
        if (notificationResult.error) {
          console.warn('[AdminUpdateTalentStatus] Notification failed:', notificationResult.error);
        } else {
          console.log('[AdminUpdateTalentStatus] Notification sent successfully');
        }
      } catch (notificationError) {
        console.warn('[AdminUpdateTalentStatus] Notification error:', notificationError);
      }

      // 5. Log admin action
      try {
        await supabaseAdmin
          .from('admin_actions')
          .insert({
            action_type: approved ? 'talent_approved' : 'talent_rejected',
            target_user_id: talentId,
            details: {
              rejection_reason: rejectionReason,
              timestamp: new Date().toISOString()
            }
          });
      } catch (logError) {
        console.warn('[AdminUpdateTalentStatus] Failed to log admin action:', logError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Talent ${approved ? 'approved' : 'rejected'} successfully`,
          data: profileData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (transactionError) {
      console.error('[AdminUpdateTalentStatus] Transaction error:', transactionError);
      throw transactionError;
    }

  } catch (error: any) {
    console.error('[AdminUpdateTalentStatus] Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
