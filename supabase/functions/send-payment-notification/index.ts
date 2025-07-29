import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentNotificationData {
  booking_id: string;
  user_phone: string;
  talent_phone: string;
  payment_details: {
    amount: number;
    payment_method: string;
    talent_earnings: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data: PaymentNotificationData = await req.json()
    console.log('Payment notification request:', data)

    const { booking_id, user_phone, talent_phone, payment_details } = data

    // Format phone numbers for Indonesian numbers
    const formatPhoneNumber = (phone: string): string => {
      let cleaned = phone.replace(/\D/g, '')
      
      if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1)
      } else if (cleaned.startsWith('62')) {
        cleaned = cleaned
      } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned
      }
      
      return cleaned
    }

    const formattedUserPhone = formatPhoneNumber(user_phone)
    const formattedTalentPhone = formatPhoneNumber(talent_phone)

    // TextMeBot API configuration
    const API_KEY = 'jYg9R67hoNMT'
    const API_URL = 'http://api.textmebot.com/send.php'

    // Send WhatsApp message function
    const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
      try {
        const apiUrl = `${API_URL}?recipient=${phone}&apikey=${API_KEY}&text=${encodeURIComponent(message)}`
        
        const response = await fetch(apiUrl, {
          method: 'GET'
        })

        console.log(`WhatsApp message sent to ${phone}`)
        return true
      } catch (error) {
        console.error(`Failed to send WhatsApp to ${phone}:`, error)
        return false
      }
    }

    // Payment confirmation message for user
    const userMessage = `💳 Payment Confirmed - Temanly

Pembayaran Anda telah berhasil dikonfirmasi:

💰 Total: Rp ${payment_details.amount.toLocaleString('id-ID')}
💳 Metode: ${payment_details.payment_method}

Booking ID: ${booking_id}

Talent akan segera menghubungi Anda. Terima kasih! 🎉`

    // Earnings notification for talent
    const talentMessage = `💰 Payment Received - Temanly

Pembayaran untuk booking Anda telah diterima:

💰 Pendapatan: Rp ${payment_details.talent_earnings.toLocaleString('id-ID')}
💳 Metode: ${payment_details.payment_method}

Booking ID: ${booking_id}

Silakan hubungi customer untuk memulai layanan. 🌟`

    // Send messages
    const userResult = await sendWhatsAppMessage(formattedUserPhone, userMessage)
    const talentResult = await sendWhatsAppMessage(formattedTalentPhone, talentMessage)

    // Log notifications to database
    const notifications = [
      {
        booking_id,
        notification_type: 'payment_confirmed',
        phone_number: formattedUserPhone,
        message_content: userMessage,
        status: userResult ? 'sent' : 'failed',
        sent_at: userResult ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      },
      {
        booking_id,
        notification_type: 'payment_confirmed',
        phone_number: formattedTalentPhone,
        message_content: talentMessage,
        status: talentResult ? 'sent' : 'failed',
        sent_at: talentResult ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      }
    ]

    const { error: logError } = await supabase
      .from('notification_logs')
      .insert(notifications)

    if (logError) {
      console.error('Failed to log notifications:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment notifications sent',
        user_sent: userResult,
        talent_sent: talentResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Payment notification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
