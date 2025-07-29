import { supabase } from '@/integrations/supabase/client';

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  recentReviews: number;
}

export interface CreateReviewData {
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
}

export interface ReviewVerificationData {
  is_verified: boolean;
  admin_notes?: string;
  verified_by: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  is_verified: boolean;
  admin_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  talent_name?: string;
  service_type?: string;
  booking?: any;
  customer?: any;
  talent?: any;
}

export class ReviewService {
  // Create a new review
  static async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .insert([{
          ...reviewData,
          is_verified: false, // Reviews need admin verification
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          booking:bookings(*),
          customer:profiles!reviewer_id(name, email),
          talent:profiles!reviewee_id(name, email)
        `)
        .single();

      if (error) {
        console.error('Error creating review:', error);
        throw error;
      }

      // Update talent statistics after review creation
      await this.updateTalentStatistics(reviewData.talent_id);

      return {
        ...review,
        customer_name: review.customer?.name || 'Unknown Customer',
        talent_name: review.talent?.name || 'Unknown Talent',
        service_type: review.booking?.service_type || 'unknown'
      };

    } catch (error) {
      console.error('Error in createReview:', error);
      throw error;
    }
  }

  // Verify review (admin function)
  static async verifyReview(reviewId: string, verificationData: ReviewVerificationData): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          ...verificationData,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error verifying review:', error);
        throw error;
      }

      // If verified, update talent statistics
      if (verificationData.is_verified) {
        const { data: review } = await supabase
          .from('reviews')
          .select('reviewee_id')
          .eq('id', reviewId)
          .single();

        if (review) {
          await this.updateTalentStatistics(review.reviewee_id);
        }
      }

    } catch (error) {
      console.error('Error in verifyReview:', error);
      throw error;
    }
  }

  // Update talent statistics based on verified reviews
  private static async updateTalentStatistics(talentId: string): Promise<void> {
    try {
      // Get all verified reviews for this talent
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('talent_id', talentId)
        .eq('is_verified', true);

      if (error) {
        console.error('Error fetching talent reviews:', error);
        return;
      }

      if (reviews && reviews.length > 0) {
        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

        // Update talent profile with new statistics
        await supabase
          .from('profiles')
          .update({
            total_orders: totalReviews,
            average_rating: Math.round(averageRating * 100) / 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', talentId);
      }

    } catch (error) {
      console.error('Error updating talent statistics:', error);
    }
  }

  // Get pending reviews for admin verification
  static async getPendingReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          booking:bookings(*),
          customer:profiles!reviewer_id(name, email),
          talent:profiles!reviewee_id(name, email)
        `)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(review => ({
        ...review,
        customer_name: review.customer?.name || 'Unknown Customer',
        talent_name: review.talent?.name || 'Unknown Talent',
        service_type: review.booking?.service_type || 'unknown'
      })) || [];

    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      return [];
    }
  }

  // Get all reviews
  static async getAllReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          booking:bookings(*),
          customer:profiles!reviewer_id(name, email),
          talent:profiles!reviewee_id(name, email)
        `)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(review => ({
        ...review,
        customer_name: review.customer?.name || 'Unknown Customer',
        talent_name: review.talent?.name || 'Unknown Talent',
        service_type: review.booking?.service_type || 'unknown'
      })) || [];

    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  // Calculate review statistics
  static async getReviewStats(): Promise<ReviewStats> {
    const reviews = await this.getAllReviews();
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? 
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
    
    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    // Count recent reviews (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReviews = reviews.filter(r => 
      new Date(r.created_at) > sevenDaysAgo
    ).length;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      recentReviews
    };
  }

  // Get reviews by rating
  static async getReviewsByRating(rating: number): Promise<Review[]> {
    const allReviews = await this.getAllReviews();
    return allReviews.filter(review => review.rating === rating);
  }

  // Get reviews by companion
  static async getReviewsByCompanion(companionId: string): Promise<Review[]> {
    const allReviews = await this.getAllReviews();
    return allReviews.filter(review => review.talent_id === companionId);
  }

  // Search reviews
  static async searchReviews(searchTerm: string): Promise<Review[]> {
    const allReviews = await this.getAllReviews();
    const term = searchTerm.toLowerCase();
    
    return allReviews.filter(review =>
      (review.customer_name || '').toLowerCase().includes(term) ||
      (review.talent_name || '').toLowerCase().includes(term) ||
      review.review_text.toLowerCase().includes(term) ||
      (review.service_type || '').toLowerCase().includes(term)
    );
  }

  // Get top rated companions
  static async getTopRatedCompanions(): Promise<Array<{
    companion_id: string;
    talent_name: string;
    average_rating: number;
    total_reviews: number;
  }>> {
    const reviews = await this.getAllReviews();
    
    // Group reviews by companion
    const companionReviews: { [key: string]: Review[] } = {};
    reviews.forEach(review => {
      if (!companionReviews[review.talent_id]) {
        companionReviews[review.talent_id] = [];
      }
      companionReviews[review.talent_id].push(review);
    });

    // Calculate average ratings
    const companionStats = Object.entries(companionReviews).map(([companionId, reviews]) => {
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return {
        companion_id: companionId,
        talent_name: reviews[0].talent_name,
        average_rating: Math.round(averageRating * 100) / 100,
        total_reviews: reviews.length
      };
    });

    // Sort by average rating and minimum review count
    return companionStats
      .filter(stat => stat.total_reviews >= 3) // Minimum 3 reviews
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 10); // Top 10
  }

  // Delete review (admin function)
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}
