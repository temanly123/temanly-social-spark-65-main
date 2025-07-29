
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  User, 
  Calendar,
  Search,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { ReviewService } from '@/services/reviewService';
import { DemoReview } from '@/services/demoDataService';

interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  is_verified: boolean;
  admin_notes?: string;
  created_at: string;
  reviewer_name?: string;
  reviewee_name?: string;
  booking_service?: string;
}

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    averageRating: 0,
    flaggedReviews: 0
  });

  useEffect(() => {
    fetchReviews();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [reviews]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(name),
          reviewee:profiles!reviewee_id(name),
          booking:bookings(service_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedReviews = data?.map(review => ({
        ...review,
        reviewer_name: review.reviewer?.name || 'Unknown User',
        reviewee_name: review.reviewee?.name || 'Unknown Talent',
        booking_service: review.booking?.service_type || 'Unknown Service'
      })) || [];

      setReviews(enrichedReviews);
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

  const setupRealTimeUpdates = () => {
    const channel = supabase
      .channel('reviews-admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => {
          console.log('🔄 [ReviewManagement] Real-time update received:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            fetchReviews();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateStats = () => {
    const totalReviews = reviews.length;
    const pendingReviews = reviews.filter(r => !r.is_verified).length;
    const approvedReviews = reviews.filter(r => r.is_verified).length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    const flaggedReviews = reviews.filter(r => r.rating <= 2).length;

    setStats({
      totalReviews,
      pendingReviews,
      approvedReviews,
      averageRating,
      flaggedReviews
    });
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const is_verified = action === 'approve';

      console.log(`${action === 'approve' ? '✅' : '❌'} [ReviewManagement] ${action}ing review:`, reviewId);

      // Find the current review in state
      const currentReview = reviews.find(r => r.id === reviewId);
      if (!currentReview) {
        throw new Error('Review not found in current state');
      }

      // Optimistically update the UI first
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? {
                ...review,
                is_verified,
                admin_notes: action === 'reject' ? 'Review rejected by admin' : (action === 'approve' ? 'Review approved by admin' : review.admin_notes)
              }
            : review
        )
      );

      // Update the database
      const { data, error } = await supabase
        .from('reviews')
        .update({
          is_verified,
          admin_notes: action === 'reject' ? 'Review rejected by admin' : (action === 'approve' ? 'Review approved by admin' : null)
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('❌ [ReviewManagement] Update error:', error);

        // Revert the optimistic update on error
        setReviews(prev =>
          prev.map(review =>
            review.id === reviewId ? currentReview : review
          )
        );

        throw new Error(`Database update failed: ${error.message}`);
      }

      console.log('✅ [ReviewManagement] Update successful:', data);

      // Ensure the UI reflects the actual database state
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? {
                ...review,
                is_verified: data.is_verified,
                admin_notes: data.admin_notes
              }
            : review
        )
      );

      // Show success message
      toast({
        title: `Review ${action}d`,
        description: `Review has been ${action}d successfully`,
        variant: action === 'approve' ? 'default' : 'destructive'
      });

      setShowDetailModal(false);
      setSelectedReview(null);

      // If approved, update talent statistics
      if (action === 'approve' && data.reviewee_id) {
        try {
          await ReviewService.updateTalentStatistics(data.reviewee_id);
          console.log('✅ [ReviewManagement] Talent statistics updated');
        } catch (statsError) {
          console.warn('⚠️ [ReviewManagement] Failed to update talent statistics:', statsError);
        }
      }

    } catch (error: any) {
      console.error(`❌ [ReviewManagement] Error ${action}ing review:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} review`,
        variant: "destructive"
      });
    }
  };

  const handleViewDetail = (review: Review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.reviewee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && !review.is_verified) ||
                         (statusFilter === 'approved' && review.is_verified);
    const matchesRating = ratingFilter === 'all' || 
                         (ratingFilter === 'high' && review.rating >= 4) ||
                         (ratingFilter === 'medium' && review.rating >= 3 && review.rating < 4) ||
                         (ratingFilter === 'low' && review.rating < 3);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading reviews...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">All time reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Need admin approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedReviews}</div>
            <p className="text-xs text-muted-foreground">Live reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Overall platform rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.flaggedReviews}</div>
            <p className="text-xs text-muted-foreground">≤ 2 stars</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review & Rating Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="high">4-5 Stars</SelectItem>
                <SelectItem value="medium">3-4 Stars</SelectItem>
                <SelectItem value="low">1-2 Stars</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              {filteredReviews.length} of {reviews.length} reviews
            </div>
          </div>

          {/* Reviews Table */}
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews match your search criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review ID</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Reviewee</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review Text</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-mono text-sm">
                      {review.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {review.reviewer_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {review.reviewee_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {review.booking_service?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renderStars(review.rating)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        {review.comment}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          review.is_verified ? 'bg-green-100 text-green-600' :
                          'bg-yellow-100 text-yellow-600'
                        }
                      >
                        {review.is_verified ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(review.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetail(review)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Detail
                        </Button>
                        {!review.is_verified && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleReviewAction(review.id, 'approve')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReviewAction(review.id, 'reject')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Review Details</span>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Reviewer</label>
                  <div className="text-lg">{selectedReview.reviewer_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reviewee</label>
                  <div className="text-lg">{selectedReview.reviewee_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Service</label>
                  <Badge variant="outline" className="mt-1">
                    {selectedReview.booking_service?.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Rating</label>
                  <div className="mt-1">{renderStars(selectedReview.rating)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Review Text</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedReview.comment}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge 
                  className={`mt-1 ${
                    selectedReview.is_verified ? 'bg-green-100 text-green-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {selectedReview.is_verified ? 'Approved' : 'Pending'}
                </Badge>
              </div>

              {!selectedReview.is_verified && (
                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-green-500 hover:bg-green-600 flex-1"
                    onClick={() => handleReviewAction(selectedReview.id, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Review
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReviewAction(selectedReview.id, 'reject')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
