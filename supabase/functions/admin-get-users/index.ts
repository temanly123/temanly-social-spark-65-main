
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  console.log('🚀 Admin get users function called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔍 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlLength: supabaseUrl?.length || 0
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required environment variables',
          users: [],
          count: 0,
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!serviceRoleKey
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔐 Attempting to fetch Auth users...')

    // Get all users from Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Auth list users error:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Auth error: ${authError.message}`,
          users: [],
          count: 0,
          authError: authError
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const users = authData?.users || []
    console.log(`✅ Successfully fetched ${users.length} Auth users`)
    
    // Enhanced logging of users
    if (users.length > 0) {
      console.log('📊 Auth users details:')
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          id: user.id.slice(0, 8) + '...',
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata
        })
      })
    } else {
      console.log('⚠️ No Auth users found')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: users,
        count: users.length,
        message: `Successfully fetched ${users.length} Auth users`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Function execution error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Function error: ${error.message}`,
        users: [],
        count: 0,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
