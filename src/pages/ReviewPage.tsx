import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ReviewService, CreateReviewData } from '@/services/reviewService';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';

const ReviewPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId || !user) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);

        // Fetch booking details
        const { data: bookingData, error } = await supabase
          .from('bookings')
          .select(`
            *,
            talent:profiles!companion_id(id, name, profile_image)
          `)
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .single();

        if (error || !bookingData) {
          toast({
            title: "Error",
            description: "Booking not found or you don't have permission to review it.",
            variant: "destructive"
          });
          navigate('/user-dashboard');
          return;
        }

        // Check if booking is completed
        if (bookingData.booking_status !== 'completed') {
          toast({
            title: "Review Not Available",
            description: "You can only review completed bookings.",
            variant: "destructive"
          });
          navigate('/user-dashboard');
          return;
        }

        // Check if review already exists
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('user_id', user.id)
          .single();

        if (existingReview) {
          setSubmitted(true);
        }

        setBooking(bookingData);

      } catch (error) {
        console.error('Error fetching booking:', error);
        toast({
          title: "Error",
          description: "Failed to load booking details.",
          variant: "destructive"
        });
        navigate('/user-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId, user, navigate, toast]);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitReview = async () => {
    if (!booking || !user) return;

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive"
      });
      return;
    }

    if (reviewText.trim().length < 10) {
      toast({
        title: "Review Too Short",
        description: "Please write at least 10 characters for your review.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      const reviewData: CreateReviewData = {
        booking_id: bookingId!,
        reviewer_id: user.id,
        reviewee_id: booking.companion_id,
        rating: rating,
        comment: reviewText.trim()
      };

      await ReviewService.createReview(reviewData);

      setSubmitted(true);
      toast({
        title: "Review Submitted!",
        description: "Thank you for your review. It will be published after admin verification.",
      });

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for your review. It will be published after admin verification.
              </p>
              <Button onClick={() => navigate('/user-dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/user-dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          </div>

          {/* Booking Info */}
          {booking && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Experience with {booking.talent?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img
                    src={booking.talent?.profile_image || '/placeholder.svg'}
                    alt={booking.talent?.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{booking.talent?.name}</h3>
                    <p className="text-sm text-gray-600">{booking.service_name}</p>
                    <p className="text-sm text-gray-500">
                      {booking.date} at {booking.time}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Form */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Your Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <Textarea
                  placeholder="Share your experience with this talent. What did you like? How was the service?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 10 characters ({reviewText.length}/10)
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitReview}
                disabled={submitting || rating === 0 || reviewText.trim().length < 10}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Review...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your review will be published after admin verification to ensure quality and authenticity.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReviewPage;
