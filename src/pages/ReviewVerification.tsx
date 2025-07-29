import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReviewData {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  talent_name: string;
  user_name: string;
}

const ReviewVerification: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [amandaReviews, setAmandaReviews] = useState<ReviewData[]>([]);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Get all reviews
      const { data: allReviews, error: allError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          talent:profiles!reviewee_id(name),
          user:profiles!reviewer_id(name)
        `)
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      const formattedReviews = allReviews?.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        talent_name: review.talent?.name || 'Unknown',
        user_name: review.user?.name || 'Unknown'
      })) || [];

      setReviews(formattedReviews);

      // Get Amanda's reviews specifically
      const { data: amandaData, error: amandaError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          talent:profiles!reviewee_id(name),
          user:profiles!reviewer_id(name)
        `)
        .eq('reviewee_id', '9153feb4-6b65-4011-b894-f7268b3abe44')
        .order('created_at', { ascending: false });

      if (amandaError) throw amandaError;

      const formattedAmandaReviews = amandaData?.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        talent_name: review.talent?.name || 'Unknown',
        user_name: review.user?.name || 'Unknown'
      })) || [];

      setAmandaReviews(formattedAmandaReviews);

      toast({
        title: "Data Loaded",
        description: `Found ${formattedReviews.length} total reviews, ${formattedAmandaReviews.length} for Amanda`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load review data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">Total Reviews: {reviews.length}</p>
              <p className="text-lg font-semibold">Amanda's Reviews: {amandaReviews.length}</p>
            </div>
            <Button onClick={fetchReviews} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>

          {amandaReviews.length === 0 ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✅ Success! Amanda has no reviews (clean profile)</p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">❌ Amanda still has {amandaReviews.length} reviews</p>
            </div>
          )}
        </CardContent>
      </Card>

      {amandaReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Amanda's Remaining Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {amandaReviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Rating: {review.rating}/5</p>
                      <p className="text-sm text-gray-600">By: {review.user_name}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-800">{review.review_text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Reviews in System ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Rating: {review.rating}/5</p>
                      <p className="text-sm text-gray-600">
                        For: {review.talent_name} | By: {review.user_name}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-800">{review.review_text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewVerification;
