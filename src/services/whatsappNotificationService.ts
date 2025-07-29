import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppNotification {
  id?: string;
  booking_id?: string;
  user_id?: string;
  talent_id?: string;
  notification_type: 'booking_confirmed' | 'contact_info' | 'review_request' | 'payment_confirmed';
  phone_number: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  response_data?: any;
  sent_at?: string;
  created_at?: string;
}

export class WhatsAppNotificationService {
  private static readonly API_KEY = 'jYg9R67hoNMT';
  private static readonly API_URL = 'http://api.textmebot.com/send.php';

  // Format phone number for Indonesian numbers
  private static formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('62')) {
      cleaned = cleaned;
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  }

  // Send WhatsApp message via TextMeBot API
  private static async sendMessage(phone: string, message: string): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const apiUrl = `${this.API_URL}?recipient=${formattedPhone}&apikey=${this.API_KEY}&text=${encodeURIComponent(message)}`;

      console.log('Sending WhatsApp notification to:', formattedPhone);
      console.log('Message:', message);

      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'no-cors'
      });

      // Since we're using no-cors, we can't read the response
      // For production, you'd want to use a server-side proxy
      return {
        success: true,
        response: { status: 'sent', timestamp: new Date().toISOString() }
      };

    } catch (error) {
      console.error('WhatsApp notification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Log notification to database
  private static async logNotification(notification: WhatsAppNotification): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert([{
          ...notification,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Failed to log notification:', error);
      }
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Send booking confirmation notification
  static async sendBookingConfirmation(
    bookingId: string,
    userPhone: string,
    talentPhone: string,
    bookingDetails: {
      talentName: string;
      userName: string;
      serviceName: string;
      date: string;
      time: string;
      totalAmount: number;
    }
  ): Promise<void> {
    // Message for user
    const userMessage = `🎉 Booking Confirmed - Temanly

Halo! Booking Anda telah dikonfirmasi:

👤 Talent: ${bookingDetails.talentName}
🎯 Layanan: ${bookingDetails.serviceName}
📅 Tanggal: ${bookingDetails.date}
⏰ Waktu: ${bookingDetails.time}
💰 Total: Rp ${bookingDetails.totalAmount.toLocaleString('id-ID')}

Talent akan menghubungi Anda segera untuk koordinasi lebih lanjut.

Booking ID: ${bookingId}

Terima kasih telah menggunakan Temanly! 💖`;

    // Message for talent
    const talentMessage = `📋 New Booking - Temanly

Anda mendapat booking baru:

👤 Customer: ${bookingDetails.userName}
🎯 Layanan: ${bookingDetails.serviceName}
📅 Tanggal: ${bookingDetails.date}
⏰ Waktu: ${bookingDetails.time}
💰 Total: Rp ${bookingDetails.totalAmount.toLocaleString('id-ID')}

Silakan hubungi customer untuk koordinasi lebih lanjut.

Booking ID: ${bookingId}

Selamat bekerja! 🌟`;

    // Send to user
    const userResult = await this.sendMessage(userPhone, userMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'booking_confirmed',
      phone_number: userPhone,
      message_content: userMessage,
      status: userResult.success ? 'sent' : 'failed',
      response_data: userResult.response,
      sent_at: userResult.success ? new Date().toISOString() : undefined
    });

    // Send to talent
    const talentResult = await this.sendMessage(talentPhone, talentMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'booking_confirmed',
      phone_number: talentPhone,
      message_content: talentMessage,
      status: talentResult.success ? 'sent' : 'failed',
      response_data: talentResult.response,
      sent_at: talentResult.success ? new Date().toISOString() : undefined
    });
  }

  // Send contact information exchange
  static async sendContactInfo(
    bookingId: string,
    userPhone: string,
    talentPhone: string,
    userDetails: { name: string; phone: string },
    talentDetails: { name: string; phone: string }
  ): Promise<void> {
    // Message for user with talent contact
    const userMessage = `📞 Contact Information - Temanly

Berikut kontak talent Anda:

👤 Nama: ${talentDetails.name}
📱 WhatsApp: ${talentDetails.phone}

Silakan hubungi talent untuk koordinasi lebih lanjut.

Booking ID: ${bookingId}`;

    // Message for talent with user contact
    const talentMessage = `📞 Contact Information - Temanly

Berikut kontak customer Anda:

👤 Nama: ${userDetails.name}
📱 WhatsApp: ${userDetails.phone}

Silakan hubungi customer untuk koordinasi lebih lanjut.

Booking ID: ${bookingId}`;

    // Send messages
    const userResult = await this.sendMessage(userPhone, userMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'contact_info',
      phone_number: userPhone,
      message_content: userMessage,
      status: userResult.success ? 'sent' : 'failed',
      response_data: userResult.response,
      sent_at: userResult.success ? new Date().toISOString() : undefined
    });

    const talentResult = await this.sendMessage(talentPhone, talentMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'contact_info',
      phone_number: talentPhone,
      message_content: talentMessage,
      status: talentResult.success ? 'sent' : 'failed',
      response_data: talentResult.response,
      sent_at: talentResult.success ? new Date().toISOString() : undefined
    });
  }

  // Send review request after booking completion
  static async sendReviewRequest(
    bookingId: string,
    userPhone: string,
    talentPhone: string,
    bookingDetails: {
      talentName: string;
      userName: string;
      serviceName: string;
    }
  ): Promise<void> {
    // Review request for user
    const userMessage = `⭐ Review Request - Temanly

Bagaimana pengalaman Anda dengan ${bookingDetails.talentName}?

Silakan berikan review dan rating untuk membantu user lain:
🌐 https://temanly.com/review/${bookingId}

Layanan: ${bookingDetails.serviceName}
Booking ID: ${bookingId}

Terima kasih atas kepercayaan Anda! 💖`;

    // Review request for talent
    const talentMessage = `⭐ Review Request - Temanly

Bagaimana pengalaman Anda dengan ${bookingDetails.userName}?

Silakan berikan review untuk customer:
🌐 https://temanly.com/talent-review/${bookingId}

Layanan: ${bookingDetails.serviceName}
Booking ID: ${bookingId}

Terima kasih atas layanan yang luar biasa! 🌟`;

    // Send messages
    const userResult = await this.sendMessage(userPhone, userMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'review_request',
      phone_number: userPhone,
      message_content: userMessage,
      status: userResult.success ? 'sent' : 'failed',
      response_data: userResult.response,
      sent_at: userResult.success ? new Date().toISOString() : undefined
    });

    const talentResult = await this.sendMessage(talentPhone, talentMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'review_request',
      phone_number: talentPhone,
      message_content: talentMessage,
      status: talentResult.success ? 'sent' : 'failed',
      response_data: talentResult.response,
      sent_at: talentResult.success ? new Date().toISOString() : undefined
    });
  }

  // Send payment confirmation
  static async sendPaymentConfirmation(
    bookingId: string,
    userPhone: string,
    talentPhone: string,
    paymentDetails: {
      amount: number;
      paymentMethod: string;
      talentEarnings: number;
    }
  ): Promise<void> {
    // Payment confirmation for user
    const userMessage = `💳 Payment Confirmed - Temanly

Pembayaran Anda telah berhasil dikonfirmasi:

💰 Total: Rp ${paymentDetails.amount.toLocaleString('id-ID')}
💳 Metode: ${paymentDetails.paymentMethod}

Booking ID: ${bookingId}

Talent akan segera menghubungi Anda. Terima kasih! 🎉`;

    // Earnings notification for talent
    const talentMessage = `💰 Payment Received - Temanly

Pembayaran untuk booking Anda telah diterima:

💰 Pendapatan: Rp ${paymentDetails.talentEarnings.toLocaleString('id-ID')}
💳 Metode: ${paymentDetails.paymentMethod}

Booking ID: ${bookingId}

Silakan hubungi customer untuk memulai layanan. 🌟`;

    // Send messages
    const userResult = await this.sendMessage(userPhone, userMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'payment_confirmed',
      phone_number: userPhone,
      message_content: userMessage,
      status: userResult.success ? 'sent' : 'failed',
      response_data: userResult.response,
      sent_at: userResult.success ? new Date().toISOString() : undefined
    });

    const talentResult = await this.sendMessage(talentPhone, talentMessage);
    await this.logNotification({
      booking_id: bookingId,
      notification_type: 'payment_confirmed',
      phone_number: talentPhone,
      message_content: talentMessage,
      status: talentResult.success ? 'sent' : 'failed',
      response_data: talentResult.response,
      sent_at: talentResult.success ? new Date().toISOString() : undefined
    });
  }
}
