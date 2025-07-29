import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { documentPath } = await req.json()

    if (!documentPath) {
      throw new Error('Document path is required')
    }

    console.log('🔍 [AdminGetDocumentUrl] Generating signed URL for:', documentPath)

    // Create signed URL with 1 hour expiry
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('verification-documents')
      .createSignedUrl(documentPath, 3600)

    if (urlError) {
      console.error('❌ [AdminGetDocumentUrl] Error creating signed URL:', urlError)
      throw urlError
    }

    console.log('✅ [AdminGetDocumentUrl] Signed URL created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        signedUrl: signedUrlData.signedUrl 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('💥 [AdminGetDocumentUrl] Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})