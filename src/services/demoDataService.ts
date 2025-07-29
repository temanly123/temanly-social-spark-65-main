// DEPRECATED: This file is being phased out as part of mock data cleanup
// All demo data has been removed from the system for production readiness

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  user_type: 'user' | 'companion' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export interface DemoBooking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  talent_name: string;
  talent_phone: string;
  service_name: string;
  service_type: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

export interface DemoReview {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewee_name: string;
  service_type: string;
  created_at: string;
  is_verified: boolean;
}

/**
 * @deprecated This service is deprecated and will be removed
 * All demo data has been cleaned up for production use
 */
export class DemoDataService {
  
  /**
   * @deprecated Returns empty array - no more demo users
   */
  static getDemoUsers(): DemoUser[] {
    console.warn('DemoDataService is deprecated. All demo data has been removed.');
    return [];
  }

  /**
   * @deprecated Returns empty array - no more demo bookings
   */
  static getDemoBookings(): DemoBooking[] {
    console.warn('DemoDataService is deprecated. All demo data has been removed.');
    return [];
  }

  /**
   * @deprecated Returns empty array - no more demo reviews
   */
  static getDemoReviews(): DemoReview[] {
    console.warn('DemoDataService is deprecated. All demo data has been removed.');
    return [];
  }

  /**
   * @deprecated No-op function - demo data cleanup completed
   */
  static clearAllDemoData(): void {
    console.log('Demo data has already been cleared from the system.');
  }
}

// Export empty arrays for backward compatibility
export const demoUsers: DemoUser[] = [];
export const demoBookings: DemoBooking[] = [];
export const demoReviews: DemoReview[] = [];
