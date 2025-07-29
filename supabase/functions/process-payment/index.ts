
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Service pricing according to Temanly system
const SERVICE_PRICES = {
  'chat': 25000, // per day
  'call': 40000, // per hour
  'video_call': 65000, // per hour
  'offline_date': 285000, // per 3 hours (base)
  'offline_date_extra': 90000, // per additional hour
  'party_buddy': 1000000, // per event (8 hours)
  'rent_a_lover': 85000 // up to per day (talent can set own rate)
};

// Commission rates based on talent level
const COMMISSION_RATES = {
  'fresh': 0.20, // 20%
  'elite': 0.18, // 18%
  'vip': 0.15 // 15%
};

const PLATFORM_FEE = 0.10; // 10%

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      bookingId,
      userId,
      companionId,
      service,
      duration,
      customAmount, // for rent_a_lover where talent sets price
      paymentMethod 
    } = await req.json();

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get companion details to determine talent level
    const { data: companion, error: companionError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', companionId)
      .single();

    if (companionError) throw companionError;

    // Calculate pricing
    let baseAmount = customAmount || SERVICE_PRICES[service] || 0;
    
    // Handle offline date extra hours
    if (service === 'offline_date' && duration > 3) {
      const extraHours = duration - 3;
      baseAmount += extraHours * SERVICE_PRICES['offline_date_extra'];
    }

    // Handle transport for offline date (20% of total tariff)
    let transportFee = 0;
    if (service === 'offline_date') {
      transportFee = baseAmount * 0.20;
    }

    const totalServiceAmount = baseAmount + transportFee;
    const platformFee = totalServiceAmount * PLATFORM_FEE;
    const totalAmount = totalServiceAmount + platformFee; // Total charged to user

    // Determine talent level and commission
    const talentLevel = determineTalentLevel(companion);
    const commissionRate = COMMISSION_RATES[talentLevel];
    const companionEarnings = totalServiceAmount * (1 - commissionRate);

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        companion_id: companionId,
        service: service,
        amount: totalAmount,
        platform_fee: platformFee,
        companion_earnings: companionEarnings,
        payment_method: paymentMethod,
        status: 'pending_verification',
        duration: duration
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update booking status
    await supabaseAdmin
      .from('bookings')
      .update({ 
        payment_status: 'pending_verification',
        total_price: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Send notification to both user and companion
    await sendPaymentNotifications(userId, companionId, transaction, supabaseAdmin);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: transaction.id,
        total_amount: totalAmount,
        platform_fee: platformFee,
        companion_earnings: companionEarnings
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

function determineTalentLevel(companion: any): 'fresh' | 'elite' | 'vip' {
  const totalBookings = companion.total_bookings || 0;
  const rating = companion.rating || 0;
  const accountAge = companion.created_at ? 
    (Date.now() - new Date(companion.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30) : 0; // months

  if (accountAge >= 6 && totalBookings >= 100 && rating >= 4.5) {
    return 'vip';
  } else if (totalBookings >= 30 && rating >= 4.5) {
    return 'elite';
  } else {
    return 'fresh';
  }
}

async function sendPaymentNotifications(userId: string, companionId: string, transaction: any, supabase: any) {
  try {
    // Get user and companion details
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: companion } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', companionId)
      .single();

    // Send WhatsApp notifications
    if (user?.phone) {
      const userMessage = `Pembayaran Anda untuk layanan ${transaction.service} sebesar Rp ${transaction.amount.toLocaleString('id-ID')} sedang diverifikasi. Anda akan segera dihubungi oleh talent.`;
      console.log('User WhatsApp notification:', userMessage);
    }

    if (companion?.phone) {
      const companionMessage = `Anda mendapat order baru untuk layanan ${transaction.service}. Earning: Rp ${transaction.companion_earnings.toLocaleString('id-ID')}. Silakan hubungi customer setelah pembayaran diverifikasi.`;
      console.log('Companion WhatsApp notification:', companionMessage);
    }

    // Here you would integrate with WhatsApp Business API
    // For example using services like Twilio, Meta WhatsApp Business API, etc.

  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}
