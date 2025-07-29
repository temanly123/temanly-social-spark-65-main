import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  MessageCircle,
  Phone,
  Video,
  PartyPopper,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookingService } from '@/services/bookingService';
import { DemoBooking } from '@/services/demoDataService';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Booking {
  id: string;
  user_id: string;
  companion_id: string;
  service_type: 'chat' | 'call' | 'video_call' | 'offline_date' | 'party_buddy' | 'rent_lover';
  booking_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'waiting_companion_contact';
  start_date: string;
  time: string;
  duration: number;
  location?: string;
  notes?: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'pending_verification';
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  user_name?: string;
  talent_name?: string;
  user_phone?: string;
  talent_phone?: string;
}

const BookingManagement = () => {
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<DemoBooking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { toast } = useToast();

  const [isClearingCache, setIsClearingCache] = useState(false);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchBookings();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [bookings]);

  const fetchBookings = async (forceRefresh: boolean = false) => {
    try {
      console.log('🔄 Admin BookingManagement: Starting fetchBookings...', { forceRefresh });
      setLoading(true);

      // Clear existing data first if force refresh
      if (forceRefresh) {
        console.log('🧹 Admin BookingManagement: Clearing existing data for force refresh...');
        setBookings([]);
        setStats({
          totalBookings: 0,
          pendingBookings: 0,
          activeBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
          pendingPayments: 0
        });
      }

      console.log('📊 Admin BookingManagement: Calling BookingService.getAllBookings()...');
      const bookingsData = await BookingService.getAllBookings(forceRefresh);
      console.log('📋 Admin BookingManagement: Received bookings data:', {
        count: bookingsData.length,
        timestamp: new Date().toISOString()
      });
      setBookings(bookingsData);

      console.log('📈 Admin BookingManagement: Calling BookingService.getBookingStats()...');
      const statsData = await BookingService.getBookingStats();
      console.log('📊 Admin BookingManagement: Received stats data:', statsData);
      setStats(statsData);

      console.log('✅ Admin BookingManagement: fetchBookings completed successfully');

      if (forceRefresh) {
        toast({
          title: "Refreshed",
          description: "Booking data has been refreshed successfully",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('❌ Admin BookingManagement: Error fetching bookings:', error);
      toast({
        title: "Error",
        description: `Failed to load booking data: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const channel = supabase
      .channel('bookings-admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateStats = () => {
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.booking_status === 'pending').length;
    const activeBookings = bookings.filter(b => b.booking_status === 'in_progress').length;
    const completedBookings = bookings.filter(b => b.booking_status === 'completed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || b.total_price || 0), 0);
    const pendingPayments = bookings.filter(b => b.payment_status === 'pending').length;

    setStats({
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      totalRevenue,
      pendingPayments
    });
  };



  const handleClearAllCaches = async () => {
    try {
      setIsClearingCache(true);
      console.log('🧹 Starting comprehensive cache clearing...');

      // 1. Clear localStorage
      console.log('🗑️ Clearing localStorage...');
      localStorage.clear();

      // 2. Clear sessionStorage
      console.log('🗑️ Clearing sessionStorage...');
      sessionStorage.clear();

      // 3. Clear IndexedDB (if available)
      if ('indexedDB' in window) {
        console.log('🗑️ Clearing IndexedDB...');
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(true);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            })
          );
        } catch (error) {
          console.log('⚠️ Could not clear IndexedDB:', error);
        }
      }

      // 4. Clear Service Worker cache (if available)
      if ('serviceWorker' in navigator && 'caches' in window) {
        console.log('🗑️ Clearing Service Worker caches...');
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          console.log('⚠️ Could not clear Service Worker caches:', error);
        }
      }

      toast({
        title: "Cache Cleared",
        description: "All caches cleared. Page will reload to ensure fresh data.",
        variant: "default"
      });

      // Wait a moment then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      toast({
        title: "Error",
        description: "Failed to clear all caches. Try manual browser refresh.",
        variant: "destructive"
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleHardRefresh = () => {
    console.log('🔄 Forcing hard refresh...');
    toast({
      title: "Hard Refresh",
      description: "Performing hard refresh to bypass all caches...",
      variant: "default"
    });

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleShowDetail = (booking: DemoBooking) => {
    console.log('🔍 Admin: Showing booking detail for:', booking.id);
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'video_call': return <Video className="w-4 h-4" />;
      case 'offline_date': return <MapPin className="w-4 h-4" />;
      case 'party_buddy': return <PartyPopper className="w-4 h-4" />;
      case 'rent_lover': return <Heart className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.talent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    const matchesService = serviceFilter === 'all' || booking.service_type === serviceFilter;
    const matchesPayment = paymentFilter === 'all' || booking.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesService && matchesPayment;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading bookings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded-lg text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>Bookings loaded: {bookings.length}</p>
        <p>Loading state: {loading ? 'true' : 'false'}</p>
        <p>Last fetch: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Booking Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">Finished orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {stats.totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">All bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Need verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Booking Management
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleClearAllCaches}
                variant="secondary"
                disabled={isClearingCache || loading}
                className="flex items-center gap-2"
              >
                <Trash2 className={`w-4 h-4 ${isClearingCache ? 'animate-spin' : ''}`} />
                {isClearingCache ? 'Clearing...' : 'Clear All Caches'}
              </Button>
              <Button
                onClick={handleHardRefresh}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Hard Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="video_call">Video Call</SelectItem>
                <SelectItem value="offline_date">Offline Date</SelectItem>
                <SelectItem value="party_buddy">Party Buddy</SelectItem>
                <SelectItem value="rent_lover">Rent a Lover</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>

          {/* Bookings Table */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings match your search criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Talent</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">
                      {booking.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.user_name}</div>
                        {booking.user_phone && (
                          <div className="text-xs text-gray-500">{booking.user_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.talent_name}</div>
                        {booking.talent_phone && (
                          <div className="text-xs text-gray-500">{booking.talent_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getServiceIcon(booking.service_type)}
                        <div>
                          <Badge variant="outline">
                            {booking.service_type.replace('_', ' ')}
                          </Badge>
                          {booking.location && (
                            <div className="text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {booking.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.duration || 1}h
                      {booking.start_date && (
                        <div className="text-xs text-gray-500">
                          {new Date(booking.start_date).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rp {(booking.total_amount || booking.total_price || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          booking.booking_status === 'completed' ? 'bg-green-100 text-green-600' :
                          booking.booking_status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          booking.booking_status === 'confirmed' ? 'bg-purple-100 text-purple-600' :
                          booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }
                      >
                        {booking.booking_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          booking.payment_status === 'paid' ? 'bg-green-100 text-green-600' :
                          booking.payment_status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }
                      >
                        {booking.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(booking.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowDetail(booking)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Booking Detail
            </DialogTitle>
            <DialogDescription>
              Complete information about this booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking ID</label>
                    <p className="font-mono text-sm">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service</label>
                    <div className="flex items-center gap-2">
                      {getServiceIcon(selectedBooking.service_type)}
                      <span>{selectedBooking.service_name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p>{selectedBooking.duration || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p>{selectedBooking.date}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div>
                      <Badge
                        className={
                          selectedBooking.booking_status === 'completed' ? 'bg-green-100 text-green-600' :
                          selectedBooking.booking_status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          selectedBooking.booking_status === 'confirmed' ? 'bg-purple-100 text-purple-600' :
                          selectedBooking.booking_status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }
                      >
                        {selectedBooking.booking_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div>
                      <Badge
                        className={
                          selectedBooking.payment_status === 'paid' ? 'bg-green-100 text-green-600' :
                          selectedBooking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }
                      >
                        {selectedBooking.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="font-semibold text-lg">
                      Rp {(selectedBooking.total_amount || selectedBooking.total_price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p>{new Date(selectedBooking.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              {/* Customer & Talent Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p>{selectedBooking.user_name || selectedBooking.customer_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p>{selectedBooking.customer_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{selectedBooking.user_phone || selectedBooking.customer_phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Talent Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p>{selectedBooking.talent_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{selectedBooking.talent_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(selectedBooking.notes || selectedBooking.location) && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Additional Information</h4>
                  <div className="space-y-2">
                    {selectedBooking.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p>{selectedBooking.location}</p>
                      </div>
                    )}
                    {selectedBooking.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-sm bg-gray-50 p-2 rounded">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default BookingManagement;
