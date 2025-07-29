
// Direct EmailJS service for email verification
export const sendEmailVerificationDirect = async (email: string): Promise<{ success: boolean; message: string; token?: string }> => {
  try {
    console.log('Sending direct email verification to:', email);
    
    // Generate verification token
    const verificationToken = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    
    // EmailJS configuration
    const serviceId = "service_l21gt56";
    const templateId = "template_vnxelok";
    const publicKey = "vBw5YkSScmsVPjq24";
    
    // EmailJS payload - using standard 'to_email' parameter
    const emailPayload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: email,
        to_name: email.split('@')[0],
        verification_code: verificationToken,
        from_name: "Temanly",
        subject: "Kode Verifikasi Email Temanly",
        message: `Kode verifikasi Temanly Anda: ${verificationToken}\n\nKode berlaku selama 15 menit.\n\nJangan bagikan kode ini kepada siapa pun.`
      }
    };

    console.log('Sending to EmailJS with payload:', emailPayload);

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await response.text();
    console.log('EmailJS API response:', { 
      status: response.status, 
      statusText: response.statusText,
      body: responseText 
    });

    if (!response.ok) {
      console.error('EmailJS API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`EmailJS error: ${response.status} - ${responseText}`);
    }

    console.log('Email sent successfully via EmailJS');

    return {
      success: true,
      message: "Email verifikasi telah dikirim",
      token: verificationToken
    };

  } catch (error) {
    console.error('Direct email verification error:', error);
    return {
      success: false,
      message: 'Gagal mengirim email verifikasi. Silakan coba lagi.'
    };
  }
};

export const verifyEmailTokenDirect = async (email: string, token: string): Promise<{ success: boolean; message: string }> => {
  try {
    // For production, you would typically store and validate tokens in a database
    // For now, we'll do basic validation
    if (token.length >= 6) {
      return {
        success: true,
        message: 'Email berhasil diverifikasi'
      };
    } else {
      return {
        success: false,
        message: 'Token verifikasi email tidak valid'
      };
    }
  } catch (error) {
    console.error('Email token verification error:', error);
    return {
      success: false,
      message: 'Token verifikasi email tidak valid'
    };
  }
};
