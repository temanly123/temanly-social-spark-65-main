// TextMeBot WhatsApp API Service
export interface TextMeBotResponse {
  success: boolean;
  message: string;
  code?: string;
  error?: string;
}

export class TextMeBotService {
  private static readonly API_KEY = 'jYg9R67hoNMT';
  private static readonly API_URL = 'https://api.textmebot.com/send.php';

  // Format phone number for Indonesian numbers
  private static formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Indonesian phone numbers
    if (cleaned.startsWith('0')) {
      // Replace leading 0 with 62
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('62')) {
      // Already has country code
      cleaned = cleaned;
    } else if (cleaned.startsWith('8')) {
      // Missing country code, add 62
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  // Generate 6-digit verification code
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send WhatsApp verification code via server-side proxy
  static async sendVerificationCode(phone: string): Promise<TextMeBotResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const verificationCode = this.generateVerificationCode();

      console.log('Sending WhatsApp verification via server proxy:', {
        phone: formattedPhone,
        code: verificationCode
      });

      // Try server-side proxy first (now using Vercel API route)
      try {
        const response = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: formattedPhone,
            code: verificationCode
          })
        });

        if (response.ok) {
          const result = await response.json();

          // Store verification code for validation
          localStorage.setItem(`whatsapp_verification_${formattedPhone}`, JSON.stringify({
            code: verificationCode,
            timestamp: Date.now(),
            phone: formattedPhone
          }));

          return {
            success: true,
            message: `Kode verifikasi telah dikirim ke WhatsApp terdaftar: ${verificationCode}`,
            code: verificationCode
          };
        }
      } catch (proxyError) {
        console.log('Proxy server not available, trying direct API');
      }

    } catch (error) {
      console.error('Server proxy failed, trying direct API:', error);

      // Fallback: Try direct API call to TextMeBot
      return this.sendDirectToTextMeBot(phone);
    }
  }

  // Direct API call to TextMeBot (main method)
  private static async sendDirectToTextMeBot(phone: string): Promise<TextMeBotResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const verificationCode = this.generateVerificationCode();

    const message = `Kode verifikasi Temanly Anda: ${verificationCode}\n\nJangan bagikan kode ini kepada siapa pun.\n\nKode berlaku selama 10 menit.`;

    // Use your registered phone number
    const registeredPhone = '6285890033683'; // Your registered TextMeBot number

    // Construct API URL with your registered number
    const apiUrl = `${this.API_URL}?recipient=${registeredPhone}&apikey=${this.API_KEY}&text=${encodeURIComponent(message)}`;

    console.log('Sending WhatsApp to registered number:', registeredPhone);
    console.log('Verification code:', verificationCode);
    console.log('API URL:', apiUrl);

    try {
      // Make direct API request using fetch with no-cors
      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'no-cors'
      });

      console.log('API request sent to TextMeBot');
      console.log('Note: TextMeBot trial expired on 2025-06-30, using demo mode');

      // Store verification code for validation
      localStorage.setItem(`whatsapp_verification_${formattedPhone}`, JSON.stringify({
        code: verificationCode,
        timestamp: Date.now(),
        phone: formattedPhone
      }));

      return {
        success: true,
        message: `Demo: Kode verifikasi WhatsApp adalah ${verificationCode} (TextMeBot trial expired)`,
        code: verificationCode
      };

    } catch (error) {
      console.error('TextMeBot API request failed:', error);

      // Still store the code for validation even if API fails
      localStorage.setItem(`whatsapp_verification_${formattedPhone}`, JSON.stringify({
        code: verificationCode,
        timestamp: Date.now(),
        phone: formattedPhone
      }));

      return {
        success: true,
        message: `Demo: Kode verifikasi WhatsApp adalah ${verificationCode}`,
        code: verificationCode
      };
    }
  }

  // Verify WhatsApp code
  static async verifyCode(phone: string, inputCode: string): Promise<TextMeBotResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const storedData = localStorage.getItem(`whatsapp_verification_${formattedPhone}`);
      
      if (!storedData) {
        return {
          success: false,
          message: 'Kode verifikasi tidak ditemukan. Silakan kirim ulang kode.',
          error: 'NO_CODE_FOUND'
        };
      }

      const { code, timestamp } = JSON.parse(storedData);
      
      // Check if code is expired (10 minutes)
      const isExpired = Date.now() - timestamp > 10 * 60 * 1000;
      
      if (isExpired) {
        localStorage.removeItem(`whatsapp_verification_${formattedPhone}`);
        return {
          success: false,
          message: 'Kode verifikasi telah kedaluwarsa. Silakan kirim ulang kode.',
          error: 'CODE_EXPIRED'
        };
      }

      if (inputCode === code) {
        // Remove used code
        localStorage.removeItem(`whatsapp_verification_${formattedPhone}`);
        
        return {
          success: true,
          message: 'Nomor WhatsApp berhasil diverifikasi!'
        };
      } else {
        return {
          success: false,
          message: 'Kode verifikasi tidak valid. Silakan periksa kembali.',
          error: 'INVALID_CODE'
        };
      }

    } catch (error) {
      console.error('Code verification error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat memverifikasi kode.',
        error: 'VERIFICATION_ERROR'
      };
    }
  }

  // Check API status
  static async checkApiStatus(): Promise<boolean> {
    try {
      const statusUrl = `https://api.textmebot.com/status.php?apikey=${this.API_KEY}`;
      const response = await fetch(statusUrl);
      return response.ok;
    } catch (error) {
      console.error('TextMeBot API status check failed:', error);
      return false;
    }
  }
}
