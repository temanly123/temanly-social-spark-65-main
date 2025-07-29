
import { sendEmailVerificationDirect, verifyEmailTokenDirect } from './emailService';
import { supabase } from '@/integrations/supabase/client';
import { TextMeBotService } from './textmebotService';

export interface VerificationRequest {
  email?: string;
  phone?: string;
  type: 'email' | 'whatsapp';
}

export const sendEmailVerification = async (email: string): Promise<{ success: boolean; message: string; token?: string }> => {
  try {
    console.log('Sending email verification to:', email);
    
    // Use direct EmailJS service
    const result = await sendEmailVerificationDirect(email);
    
    console.log('Email verification result:', result);
    
    return result;

  } catch (error) {
    console.error('Email verification error:', error);
    
    return {
      success: false,
      message: 'Gagal mengirim email verifikasi. Silakan coba lagi.'
    };
  }
};

export const sendWhatsAppVerification = async (phone: string): Promise<{ success: boolean; message: string; code?: string }> => {
  try {
    console.log('Sending WhatsApp verification to:', phone);

    // Try TextMeBot service first
    const textmebotResult = await TextMeBotService.sendVerificationCode(phone);

    if (textmebotResult.success) {
      return textmebotResult;
    }

    // Fallback to Supabase edge function
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabase.functions.invoke('send-whatsapp-verification', {
      body: {
        phone: phone,
        code: verificationCode
      }
    });

    if (error) {
      console.error('Supabase WhatsApp verification error:', error);
      // Return demo code as final fallback
      return {
        success: true,
        message: `Demo: Kode verifikasi WhatsApp adalah ${verificationCode}`,
        code: verificationCode
      };
    }

    console.log('Supabase WhatsApp verification result:', data);

    return {
      success: data.success,
      message: data.message || 'Kode WhatsApp telah dikirim',
      code: verificationCode
    };

  } catch (error) {
    console.error('WhatsApp verification error:', error);

    // Final fallback with demo code
    const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      message: `Demo: Kode verifikasi WhatsApp adalah ${demoCode}`,
      code: demoCode
    };
  }
};

export const verifyWhatsAppCode = async (phone: string, code: string, expectedCode: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Try TextMeBot verification first
    const textmebotResult = await TextMeBotService.verifyCode(phone, code);

    if (textmebotResult.success) {
      return textmebotResult;
    }

    // Fallback to simple code comparison
    if (code === expectedCode) {
      return {
        success: true,
        message: 'Nomor WhatsApp berhasil diverifikasi'
      };
    } else {
      return {
        success: false,
        message: 'Kode verifikasi tidak valid'
      };
    }
  } catch (error) {
    console.error('WhatsApp code verification error:', error);
    return {
      success: false,
      message: 'Gagal memverifikasi kode WhatsApp'
    };
  }
};

export const verifyEmailToken = async (email: string, token: string): Promise<{ success: boolean; message: string }> => {
  try {
    return await verifyEmailTokenDirect(email, token);
  } catch (error) {
    console.error('Email token verification error:', error);
    return {
      success: false,
      message: 'Token verifikasi email tidak valid'
    };
  }
};
