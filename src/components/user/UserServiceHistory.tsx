import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, Calendar, Clock, DollarSign, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ChatButton from '@/components/chat/ChatButton';
import { useNavigate } from 'react-router-dom';
import RatingModal from '@/components/RatingModal';

interface Booking {
  id: string;
  talent_name: string;
  service_type: string;
  date: string;
  amount: number;
  status: string;
  duration?: string;
  rating?: number;
  created_at: string;
  companion_id?: string;
  talent_profile?: any;
}

const UserServiceHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user && user.id) {
      fetchBookings();
    }
  }, [user?.id]); // Only re-run when user ID changes, not the entire user object

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_type,
          date,
          total_price,
          booking_status,
          duration,
          created_at,
          companion_id,
          profiles!bookings_companion_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get existing ratings for these bookings
      const bookingIds = data?.map(b => b.id) || [];
      const { data: reviews } = await supabase
        .from('reviews')
        .select('booking_id, rating')
        .in('booking_id', bookingIds)
        .eq('reviewer_id', user.id);

      const reviewsMap = new Map(reviews?.map(r => [r.booking_id, r.rating]) || []);

      const formattedBookings = data?.map(booking => ({
        id: booking.id,
        talent_name: booking.profiles?.name || 'Unknown Talent',
        service_type: booking.service_type || 'Unknown Service',
        date: booking.date || booking.created_at,
        amount: booking.total_price || 0,
        status: booking.booking_status || 'pending',
        duration: booking.duration?.toString() || '1 hour',
        created_at: booking.created_at,
        companion_id: booking.companion_id,
        talent_profile: booking.profiles,
        rating: reviewsMap.get(booking.id)
      })) || [];

      setBookings(formattedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat booking",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">Sedang Berlangsung</Badge>;
      case 'confirmed':
        return <Badge className="bg-yellow-100 text-yellow-800">Dikonfirmasi</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Menunggu</Badge>;
    }
  };

  const formatServiceType = (service: string) => {
    const serviceMap: { [key: string]: string } = {
      'chat': 'Chat',
      'call': 'Voice Call',
      'video_call': 'Video Call',
      'offline_date': 'Offline Date',
      'party_buddy': 'Party Buddy',
      'rent_lover': 'Rent a Lover'
    };
    return serviceMap[service] || service;
  };

  const handleRatingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setRatingModalOpen(true);
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!user || !selectedBooking) return;

    try {
      // Get talent ID from the booking
      const talentId = selectedBooking.companion_id || selectedBooking.talent_profile?.id;

      if (!talentId) {
        toast({
          title: "Error",
          description: "Tidak dapat menemukan informasi talent untuk booking ini.",
          variant: "destructive"
        });
        return;
      }

      // Check if review already exists
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', selectedBooking.id)
        .eq('reviewer_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing review:', checkError);
        throw checkError;
      }

      if (existingReview) {
        toast({
          title: "Rating Sudah Ada",
          description: "Anda sudah memberikan rating untuk booking ini.",
          variant: "destructive"
        });
        return;
      }

      // Create the review
      const { data: newReview, error: createError } = await supabase
        .from('reviews')
        .insert([{
          booking_id: selectedBooking.id,
          reviewer_id: user.id,
          reviewee_id: talentId,
          rating,
          comment: comment || '',
          is_verified: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating review:', createError);
        throw createError;
      }

      console.log('Review created successfully:', newReview);

      // Update the booking in the local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === selectedBooking.id
            ? { ...booking, rating: rating }
            : booking
        )
      );

      toast({
        title: "Rating Berhasil Dikirim!",
        description: "Terima kasih atas rating Anda. Rating akan ditampilkan setelah diverifikasi admin.",
      });

      setRatingModalOpen(false);
      setSelectedBooking(null);

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Gagal Mengirim Rating",
        description: error.message || "Terjadi kesalahan saat mengirim rating. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat riwayat booking...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Riwayat Layanan
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Daftar semua booking yang pernah Anda lakukan
        </p>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada riwayat booking</p>
            <p className="text-sm text-gray-500 mb-4">Mulai booking talent pertama Anda!</p>
            <Button onClick={() => navigate('/talents')}>
              Browse Talents
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talent</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Chat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.talent_name}</TableCell>
                  <TableCell>{formatServiceType(booking.service_type)}</TableCell>
                  <TableCell>
                    {new Date(booking.date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.duration}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Rp {booking.amount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>
                    {booking.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{booking.rating}</span>
                      </div>
                    ) : booking.status === 'completed' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRatingClick(booking)}
                      >
                        Beri Rating
                      </Button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChatButton
                      talentId={booking.talent_id}
                      onChatStart={(conversationId) => {
                        if (conversationId) {
                          window.open(`/chat/${conversationId}`, '_blank');
                        } else {
                          window.open(`/chat?talentId=${booking.talent_id}`, '_blank');
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => {
          setRatingModalOpen(false);
          setSelectedBooking(null);
        }}
        onSubmit={handleRatingSubmit}
        talentName={selectedBooking?.talent_name || ''}
        bookingId={selectedBooking?.id || ''}
      />
    </Card>
  );
};

export default UserServiceHistory;