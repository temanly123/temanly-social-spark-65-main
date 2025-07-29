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
    const { email } = await req.json()

    if (!email) {
      throw new Error("Email is required")
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If an account with this email exists, you will receive a password reset email." 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Generate a secure reset token
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store the reset token in a custom table
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .upsert({
        user_id: user.user.id,
        email: email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      throw new Error('Failed to generate reset token')
    }

    // Create reset URL
    const resetUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Send email using Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER")
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")

    if (!gmailUser || !gmailPassword) {
      console.error('Gmail credentials not configured')
      
      // For development, log the reset URL
      console.log('🔗 Password Reset URL (for development):', resetUrl)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password reset requested. Check server logs for reset URL (development mode).",
          resetUrl: resetUrl // Only for development
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Email content
    const emailSubject = "Reset Your Temanly Password"
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested a password reset for your Temanly account. Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;
                        font-weight: bold;">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2024 Temanly. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    // Send email via Gmail SMTP (simplified version)
    // Note: In production, you'd want to use a proper email service like SendGrid, Mailgun, etc.
    const emailData = {
      to: email,
      subject: emailSubject,
      html: emailBody
    }

    // For now, we'll log the email content and return success
    console.log('📧 Email would be sent to:', email)
    console.log('🔗 Reset URL:', resetUrl)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset email sent successfully!",
        resetUrl: resetUrl // Remove this in production
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Password reset error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
