
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
    const { userId, approved } = await req.json();

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Send email notification
    const emailData = {
      to: profile.email,
      subject: approved ? 'Selamat! Akun Temanly Anda telah disetujui' : 'Update Status Registrasi Temanly',
      html: approved ? getApprovalEmailTemplate(profile) : getRejectionEmailTemplate(profile)
    };

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll log the email content
    console.log('Email to be sent:', emailData);

    // If using a service like Resend:
    /*
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@temanly.com",
          to: profile.email,
          subject: emailData.subject,
          html: emailData.html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`);
      }
    }
    */

    // Send WhatsApp notification if phone number is available
    if (profile.phone) {
      const whatsappMessage = approved 
        ? `🎉 Selamat! Akun Temanly Anda telah disetujui. Silakan login untuk mulai menggunakan layanan kami.`
        : `Maaf, registrasi Anda belum dapat disetujui saat ini. Silakan hubungi customer service untuk informasi lebih lanjut.`;

      console.log('WhatsApp message:', whatsappMessage);
      // Integrate with WhatsApp API here
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

function getApprovalEmailTemplate(profile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Selamat! Akun Temanly Anda Disetujui</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63;">Temanly</h1>
        </div>
        
        <h2 style="color: #4caf50;">🎉 Selamat! Akun Anda telah disetujui</h2>
        
        <p>Halo ${profile.name},</p>
        
        <p>Kami dengan senang hati menginformasikan bahwa akun Temanly Anda telah berhasil diverifikasi dan disetujui!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Langkah Selanjutnya:</h3>
          <ul>
            <li>Login ke akun Anda di aplikasi Temanly</li>
            <li>${profile.user_type === 'companion' ? 'Lengkapi profil talent Anda' : 'Mulai browsing talent yang tersedia'}</li>
            <li>Jelajahi semua fitur yang tersedia</li>
          </ul>
        </div>
        
        <p>Terima kasih telah bergabung dengan komunitas Temanly. Kami berkomitmen untuk memberikan pengalaman terbaik bagi Anda.</p>
        
        <p>Jika ada pertanyaan, jangan ragu untuk menghubungi tim customer service kami.</p>
        
        <p>Salam hangat,<br>Tim Temanly</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
        </p>
      </div>
    </body>
    </html>
  `;
}

function getRejectionEmailTemplate(profile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Update Status Registrasi Temanly</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63;">Temanly</h1>
        </div>
        
        <h2>Update Status Registrasi</h2>
        
        <p>Halo ${profile.name},</p>
        
        <p>Terima kasih atas minat Anda untuk bergabung dengan Temanly. Setelah melalui proses review, kami belum dapat menyetujui registrasi Anda saat ini.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Kemungkinan alasan:</h3>
          <ul>
            <li>Dokumen yang diberikan kurang lengkap atau tidak jelas</li>
            <li>Informasi yang diberikan tidak sesuai dengan persyaratan</li>
            <li>Perlu verifikasi tambahan</li>
          </ul>
        </div>
        
        <p>Jangan khawatir! Anda dapat menghubungi tim customer service kami untuk mendapatkan informasi lebih lanjut mengenai status registrasi Anda dan langkah-langkah yang perlu dilakukan.</p>
        
        <p>Kami sangat menghargai minat Anda dan berharap dapat membantu Anda bergabung dengan komunitas Temanly di masa mendatang.</p>
        
        <p>Salam hangat,<br>Tim Temanly</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
        </p>
      </div>
    </body>
    </html>
  `;
}
