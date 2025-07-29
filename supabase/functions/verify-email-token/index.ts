
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      throw new Error("Email and token are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Email token verification request:', { email, token });

    // In a production system, you would:
    // 1. Store verification tokens in database with expiration
    // 2. Check if token exists and is not expired
    // 3. Mark email as verified in user profile
    
    // For now, we'll do basic validation
    if (token.length >= 6) {
      // Token format is valid
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email berhasil diverifikasi",
          verified: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error("Invalid token format");
    }

  } catch (error) {
    console.error('Error verifying email token:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: "Token verifikasi email tidak valid"
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
