import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { WhatsAppNotificationService } from './whatsappNotificationService';
import { PaymentService } from './paymentService';

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface CreateBookingData {
  companion_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  service_type: 'chat' | 'call' | 'video_call' | 'offline_date' | 'party_buddy' | 'rent_lover';
  date: string;
  time: string;
  duration: number;
  location?: string;
  date_plan?: string;
  date_location?: string;
  notes?: string;
  total_price: number;
  transport_fee?: number;
  platform_fee: number;
  talent_earnings: number;
  commission_rate: number;
  payment_status: 'pending' | 'paid' | 'failed';
  booking_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  verification_required: boolean;
  selected_services: Array<{
    id: string;
    name: string;
    type: string;
    rate: number;
    duration: number;
    subtotal: number;
  }>;
}

export interface BookingResponse {
  id: string;
  booking: CreateBookingData;
  payment_url?: string;
  midtrans_token?: string;
}

export class BookingService {
  // Create a new booking with complete flow
  static async createBooking(bookingData: CreateBookingData): Promise<BookingResponse> {
    try {
      // Generate unique booking ID
      const bookingId = `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          id: bookingId,
          ...bookingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw new Error('Failed to create booking');
      }

      // Create booking services records
      if (bookingData.selected_services && bookingData.selected_services.length > 0) {
        const { error: servicesError } = await supabase
          .from('booking_services')
          .insert(
            bookingData.selected_services.map(service => ({
              booking_id: bookingId,
              service_type: service.type,
              service_name: service.name,
              duration: service.duration,
              rate: service.rate,
              subtotal: service.subtotal
            }))
          );

        if (servicesError) {
          console.error('Error creating booking services:', servicesError);
        }
      }

      // Create payment transaction record
      const paymentTransaction = await PaymentService.createPaymentTransaction({
        id: `PAY-${bookingId}`,
        midtrans_order_id: bookingId,
        amount: bookingData.total_price,
        service_name: bookingData.service_name,
        service_type: bookingData.service_type,
        duration: bookingData.duration,
        platform_fee: bookingData.platform_fee,
        companion_earnings: bookingData.talent_earnings,
        commission_rate: bookingData.commission_rate,
        status: 'pending',
        payment_status: bookingData.payment_status,
        payment_method: 'midtrans',
        companion_id: bookingData.companion_id,
        user_id: bookingData.user_id
      });

      // Get talent and user details for notifications
      const { data: talentData } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', bookingData.companion_id)
        .single();

      const { data: userData } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', bookingData.user_id)
        .single();

      // Send WhatsApp notifications
      if (talentData && userData) {
        await WhatsAppNotificationService.sendBookingConfirmation(
          bookingId,
          bookingData.customer_phone,
          talentData.phone,
          {
            talentName: talentData.name,
            userName: bookingData.customer_name,
            serviceName: bookingData.service_name,
            date: bookingData.date,
            time: bookingData.time,
            totalAmount: bookingData.total_price
          }
        );

        // Send contact information exchange
        await WhatsAppNotificationService.sendContactInfo(
          bookingId,
          bookingData.customer_phone,
          talentData.phone,
          { name: bookingData.customer_name, phone: bookingData.customer_phone },
          { name: talentData.name, phone: talentData.phone }
        );
      }

      return {
        id: bookingId,
        booking: bookingData,
        payment_url: `https://app.midtrans.com/snap/v1/transactions/${bookingId}/pay`,
        midtrans_token: `demo-token-${bookingId}`
      };

    } catch (error) {
      console.error('Error in createBooking:', error);
      throw error;
    }
  }

  // Complete booking and send review requests
  static async completeBooking(bookingId: string): Promise<void> {
    try {
      // Update booking status
      await this.updateBookingStatus(bookingId, 'completed');

      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          user_profile:profiles!user_id(name, phone),
          talent_profile:profiles!companion_id(name, phone)
        `)
        .eq('id', bookingId)
        .single();

      if (booking && booking.user_profile && booking.talent_profile) {
        // Send review requests
        await WhatsAppNotificationService.sendReviewRequest(
          bookingId,
          booking.customer_phone,
          booking.talent_profile.phone,
          {
            talentName: booking.talent_profile.name,
            userName: booking.customer_name,
            serviceName: booking.service_name
          }
        );

        // Mark review request as sent
        await supabase
          .from('bookings')
          .update({ review_requested: true })
          .eq('id', bookingId);
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  }

  // Get all bookings with demo data fallback
  static async getAllBookings(forceRefresh: boolean = false): Promise<DemoBooking[]> {
    try {
      console.log('🔍 BookingService: Starting getAllBookings query...', { forceRefresh, timestamp: new Date().toISOString() });

      // Create a fresh Supabase client instance for force refresh to bypass any client-side caching
      const clientToUse = forceRefresh ?
        createClient(
          'https://enyrffgedfvgunokpmqk.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8',
          {
            auth: {
              storage: localStorage,
              persistSession: true,
              autoRefreshToken: true,
            }
          }
        ) : supabase;

      if (forceRefresh) {
        console.log('🔄 BookingService: Using fresh client instance to bypass cache...');
      }

      let query = clientToUse
        .from('bookings')
        .select(`
          *,
          user_profile:profiles!user_id(name, phone),
          talent_profile:profiles!companion_id(name, phone)
        `)
        .order('created_at', { ascending: false });

      // Add cache-busting headers for force refresh
      if (forceRefresh) {
        // Add a random parameter to bust HTTP cache
        const cacheBuster = `cache_bust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🔄 BookingService: Adding cache buster:', cacheBuster);
      }

      const { data, error } = await query;

      console.log('📊 BookingService: Raw query result:', {
        dataCount: data?.length || 0,
        error: error?.message || 'none',
        timestamp: new Date().toISOString(),
        forceRefresh,
        actualData: data
      });

      if (error) {
        console.error('❌ BookingService: Database error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`✅ BookingService: Found ${data.length} bookings, mapping data...`);
        console.log('📋 BookingService: Raw booking data:', data);
        const mappedData = data.map(booking => ({
          ...booking,
          user_name: booking.user_profile?.name || 'Unknown User',
          talent_name: booking.talent_profile?.name || 'Unknown Talent',
          user_phone: booking.user_profile?.phone || '',
          talent_phone: booking.talent_profile?.phone || '',
          service_name: this.getServiceName(booking.service_type),
          total_amount: booking.total_price // Map total_price to total_amount for compatibility
        }));
        console.log('📋 BookingService: Mapped bookings:', mappedData);
        return mappedData;
      }

      console.log('ℹ️ BookingService: No bookings found, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ BookingService: Error fetching bookings:', error);
      throw error;
    }
  }

  // Calculate booking statistics
  static async getBookingStats(): Promise<BookingStats> {
    const bookings = await this.getAllBookings();
    
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.booking_status === 'pending').length;
    const activeBookings = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.booking_status)).length;
    const completedBookings = bookings.filter(b => b.booking_status === 'completed').length;
    
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const pendingPayments = bookings
      .filter(b => b.payment_status === 'pending')
      .reduce((sum, b) => sum + b.total_amount, 0);

    return {
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      totalRevenue,
      pendingPayments
    };
  }

  // Update booking status
  static async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateBookingStatus:', error);
      throw error;
    }
  }

  // Get service name from type
  private static getServiceName(serviceType: string): string {
    const serviceNames: { [key: string]: string } = {
      'chat': 'Chat Companion',
      'call': 'Voice Call',
      'video_call': 'Video Call',
      'offline_date': 'Offline Date',
      'party_buddy': 'Party Buddy',
      'rent_lover': 'Rent a Lover'
    };
    
    return serviceNames[serviceType] || serviceType;
  }

  // Get bookings by status
  static async getBookingsByStatus(status: string): Promise<DemoBooking[]> {
    const allBookings = await this.getAllBookings();
    return allBookings.filter(booking => booking.booking_status === status);
  }

  // Get bookings by payment status
  static async getBookingsByPaymentStatus(paymentStatus: string): Promise<DemoBooking[]> {
    const allBookings = await this.getAllBookings();
    return allBookings.filter(booking => booking.payment_status === paymentStatus);
  }

  // Search bookings
  static async searchBookings(searchTerm: string): Promise<DemoBooking[]> {
    const allBookings = await this.getAllBookings();
    const term = searchTerm.toLowerCase();
    
    return allBookings.filter(booking => 
      booking.customer_name.toLowerCase().includes(term) ||
      booking.talent_name.toLowerCase().includes(term) ||
      booking.customer_email.toLowerCase().includes(term) ||
      booking.service_name.toLowerCase().includes(term) ||
      booking.id.toLowerCase().includes(term)
    );
  }
}
