import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import MidtransPayment from '@/components/payment/MidtransPayment';
import MultiServiceSelector from '@/components/MultiServiceSelector';
import ServiceRestrictionNotice from '@/components/ServiceRestrictionNotice';
import VerificationStatus from '@/components/VerificationStatus';
import { useAuth } from '@/contexts/AuthContext';
import { calculateTotalPrice, getServiceRestrictions, hasRestrictedServices } from '@/utils/serviceCalculations';
import { supabase } from '@/integrations/supabase/client';

interface ServiceSelection {
  id: string;
  duration: number;
  durationUnit: string;
  datePlan?: string;
  location?: string;
}

const BookingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, switchUserType } = useAuth();
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedServices, setSelectedServices] = useState<ServiceSelection[]>([]);
  const [bookingForm, setBookingForm] = useState({
    message: '',
  });

  // Get talent ID and service from URL params
  const talentParam = searchParams.get('talent');
  const serviceParam = searchParams.get('service');
  const serviceNameParam = searchParams.get('serviceName');
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get the correct user profile ID for booking
  useEffect(() => {
    const getUserProfileId = async () => {
      if (!user?.email) return;

      try {
        // Find the user profile (not companion) for this email
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('email', user.email)
          .eq('user_type', 'user');

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (profiles && profiles.length > 0) {
          setUserProfileId(profiles[0].id);
          console.log('✅ BookingPage: Found user profile ID for booking:', profiles[0].id);
          console.log('✅ BookingPage: Current user context:', {
            currentUserId: user.id,
            currentUserType: user.user_type,
            userEmail: user.email,
            foundUserProfileId: profiles[0].id
          });
        } else {
          console.log('❌ BookingPage: No user profile found for email:', user.email);
          toast({
            title: "Profile Required",
            description: "You need a user profile to make bookings. Please create one first.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error getting user profile:', error);
      }
    };

    getUserProfileId();
  }, [user?.email]);

  // Fetch real talent data from database
  useEffect(() => {
    const fetchTalent = async () => {
      if (!talentParam) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', talentParam)
          .eq('user_type', 'companion')
          .eq('status', 'active')
          .single();

        if (error) {
          console.error('Error fetching talent:', error);
          return;
        }

        setTalent({
          id: data.id,
          companion_id: data.id,
          name: data.name,
          rating: data.average_rating || 0,
          reviews: data.total_bookings || 0,
          image: data.profile_image,
          level: data.talent_level || 'Fresh',
          bio: data.bio,
          isOnline: data.is_available
        });
      } catch (error) {
        console.error('Error fetching talent:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, [talentParam]);

  // Pre-select service if provided in URL params
  useEffect(() => {
    if (serviceParam && serviceNameParam && !selectedServices.length) {
      console.log('🎯 Pre-selecting service from URL:', { serviceParam, serviceNameParam });

      // Create a service selection based on URL params
      const preSelectedService: ServiceSelection = {
        id: serviceParam,
        duration: 1, // Default duration
        durationUnit: 'hour'
      };

      setSelectedServices([preSelectedService]);

      toast({
        title: `${decodeURIComponent(serviceNameParam)} Selected!`,
        description: "Service has been pre-selected. Choose your date and complete the booking.",
      });
    }
  }, [serviceParam, serviceNameParam, selectedServices.length, toast]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!talent) {
    return <div className="min-h-screen flex items-center justify-center">Talent not found</div>;
  }

  const isVerified = user?.verified || false;
  const restrictedServices = getServiceRestrictions(isVerified);
  const hasRestricted = hasRestrictedServices(selectedServices, isVerified);
  
  const totalPrice = calculateTotalPrice(selectedServices);
  const platformFee = Math.round(totalPrice * 0.1);
  const finalTotal = totalPrice + platformFee;

  const handlePaymentSuccess = async (result: any) => {
    console.log('Payment successful:', result);

    try {
      if (!userProfileId) {
        throw new Error('User profile not found');
      }

      console.log('🔥 BookingPage: Creating booking with:', {
        userProfileId,
        companionId: talent.companion_id,
        currentUser: user?.id,
        userType: user?.user_type,
        talentName: talent.name,
        selectedServices: selectedServices.map(s => s.id)
      });

      // Create booking record in Supabase with correct field names and UUID companion_id
      const bookingData = {
        user_id: userProfileId, // Use the correct user profile ID
        companion_id: talent.companion_id, // Use proper UUID instead of talent.id
        customer_name: user.name || 'Customer',
        customer_email: user.email || 'customer@example.com',
        customer_phone: user.phone || '08123456789',
        service_name: selectedServices.map(s => s.id).join(', '),
        service_type: selectedServices[0]?.id || 'chat', // Add service_type for dashboard compatibility
        date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        time: '00:00',
        duration: selectedServices.reduce((total, service) => total + service.duration, 0),
        total_price: finalTotal,
        payment_status: 'paid',
        booking_status: 'confirmed',
        notes: bookingForm.message,
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          payment_reference: result.order_id || result.transaction_id,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('❌ BookingPage: Error creating booking:', bookingError);
        // Redirect to payment status page with error info
        const params = new URLSearchParams({
          status: 'success',
          orderId: result.order_id || result.transaction_id || '',
          amount: finalTotal.toString(),
          service: selectedServices.map(s => s.id).join(', '),
          talent: talent.name,
          message: 'Payment successful but booking data could not be saved. Please contact support.'
        });
        navigate(`/payment-status?${params.toString()}`);
        return;
      }

      console.log('✅ BookingPage: Booking created successfully:', booking);

      // Redirect to success page
      const params = new URLSearchParams({
        status: 'success',
        orderId: booking.id,
        amount: finalTotal.toString(),
        service: selectedServices.map(s => s.id).join(', '),
        talent: talent.name
      });
      navigate(`/payment-status?${params.toString()}`);

    } catch (error) {
      console.error('Error saving booking:', error);
      // Redirect to payment status page with error info
      const params = new URLSearchParams({
        status: 'success',
        orderId: result.order_id || result.transaction_id || '',
        amount: finalTotal.toString(),
        service: selectedServices.map(s => s.id).join(', '),
        talent: talent.name,
        message: 'Payment successful but there was an error saving your booking. Please contact support.'
      });
      navigate(`/payment-status?${params.toString()}`);
    }
  };

  const handlePaymentPending = async (result: any) => {
    console.log('Payment pending:', result);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create pending booking record with correct field names and UUID companion_id
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userProfileId, // Use the correct user profile ID
          companion_id: talent.companion_id, // Use proper UUID instead of talent.id
          customer_name: user.name || 'Customer',
          customer_email: user.email || 'customer@example.com',
          customer_phone: user.phone || '08123456789',
          service_name: selectedServices.map(s => s.id).join(', '),
          service_type: selectedServices[0]?.id || 'chat', // Add service_type for dashboard compatibility
          date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          time: '00:00',
          duration: selectedServices.reduce((total, service) => total + service.duration, 0),
          total_price: finalTotal,
          payment_status: 'pending',
          booking_status: 'pending',
          notes: bookingForm.message,
          payment_reference: result.order_id || result.transaction_id,
        })
        .select()
        .single();

      let pendingMessage = "Your payment is being processed. You will receive a notification once completed.";
      
      // Special message for bank transfer
      if (result.payment_type === 'bank_transfer') {
        pendingMessage = "Please complete your bank transfer payment. Your booking will be confirmed once payment is received.";
      }

      // Redirect to pending status page
      const params = new URLSearchParams({
        status: 'pending',
        orderId: booking?.id || result.order_id || result.transaction_id || '',
        amount: finalTotal.toString(),
        service: selectedServices.map(s => s.id).join(', '),
        talent: talent.name,
        message: pendingMessage
      });
      navigate(`/payment-status?${params.toString()}`);

    } catch (error) {
      console.error('Error saving pending booking:', error);
      // Redirect to pending status page with error info
      const params = new URLSearchParams({
        status: 'pending',
        orderId: result.order_id || result.transaction_id || '',
        amount: finalTotal.toString(),
        service: selectedServices.map(s => s.id).join(', '),
        talent: talent.name,
        message: 'Payment is being processed but there was an error saving your booking. Please contact support.'
      });
      navigate(`/payment-status?${params.toString()}`);
    }
  };

  const handlePaymentError = (result: any) => {
    console.error('Payment failed:', result);
    
    let errorMessage = "There was an error processing your payment. Please try again.";
    
    if (result && result.message) {
      errorMessage = result.message;
    } else if (typeof result === 'string') {
      errorMessage = result;
    }
    
    // Redirect to failed status page
    const params = new URLSearchParams({
      status: 'failed',
      amount: finalTotal.toString(),
      service: selectedServices.map(s => s.id).join(', '),
      talent: talent.name,
      message: errorMessage
    });
    navigate(`/payment-status?${params.toString()}`);
  };

  const bookingData = {
    talent: talent.name,
    service: selectedServices.map(s => s.id).join(', '),
    services: selectedServices,
    date: selectedDate!,
    time: '00:00',
    message: bookingForm.message,
    total: finalTotal
  };

  const isFormValid = selectedServices.length > 0 && selectedDate && !hasRestricted && userProfileId;

  if (!userProfileId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">User Profile Required</h2>
            <p className="text-gray-600 mb-4">You need a user profile to make bookings. Please create one or switch to your user account.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Book Talent" 
        subtitle="Complete your booking details"
        backTo="/talents"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Talent Profile */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img 
                    src={talent.image} 
                    alt={talent.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h2 className="text-xl font-bold">{talent.name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{talent.rating}</span>
                    <span className="text-gray-500">({talent.reviews} reviews)</span>
                  </div>
                  <Badge className="mt-2 bg-blue-100 text-blue-600">{talent.level}</Badge>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${talent.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-600">{talent.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  
                  {/* User Verification Status */}
                  <div className="mt-3">
                    <VerificationStatus user={user} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-gray-600 break-words overflow-hidden">{talent.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service Restriction Notice */}
            <ServiceRestrictionNotice 
              isVerified={isVerified}
              restrictedServices={restrictedServices}
            />
            
            {/* Multi Service Selection */}
            <MultiServiceSelector
              selectedServices={selectedServices}
              onServiceChange={setSelectedServices}
              isVerified={isVerified}
            />

            {/* Date Selection */}
            {selectedServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message */}
            {selectedServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Special Message (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Any special requests or message for the talent..."
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev, 
                      message: e.target.value
                    }))}
                    rows={3}
                  />
                </CardContent>
              </Card>
            )}

            {/* Order Summary & Payment */}
            {selectedServices.length > 0 && totalPrice > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary & Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {selectedServices.map((service, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {service.id.replace('-', ' ')} ({service.duration} {service.durationUnit})
                          </span>
                          <span>Rp {calculateTotalPrice([service]).toLocaleString()}</span>
                        </div>
                      ))}
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>Rp {totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Platform Fee (10%)</span>
                          <span>Rp {platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                          <span>Total</span>
                          <span>Rp {finalTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Options */}
                    <div className="mt-6 space-y-4">
                      {/* Debug: Skip Payment Button */}
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">🧪 Debug Mode</h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          Skip payment for testing purposes
                        </p>
                        <div className="text-xs text-yellow-600 mb-3 p-2 bg-yellow-100 rounded">
                          Form Status: {isFormValid ? '✅ Valid' : '❌ Invalid'}<br/>
                          Services: {selectedServices.length} selected<br/>
                          Date: {selectedDate ? '✅ Set' : '❌ Not set'}<br/>
                          Restricted: {hasRestricted ? '❌ Has restricted' : '✅ No restrictions'}<br/>
                          User ID: {userProfileId ? '✅ Found' : '❌ Missing'}
                        </div>
                        <Button
                          onClick={async () => {
                            console.log('🧪 Debug payment bypass triggered');
                            console.log('🧪 Form validation status:', {
                              isFormValid,
                              selectedServices: selectedServices.length,
                              selectedDate: !!selectedDate,
                              hasRestricted,
                              userProfileId
                            });

                            if (!userProfileId) {
                              console.error('❌ Cannot proceed: No user profile ID');
                              return;
                            }

                            // Simulate successful payment
                            await handlePaymentSuccess({
                              order_id: `DEBUG-${Date.now()}`,
                              transaction_id: `TXN-${Date.now()}`,
                              payment_type: 'debug'
                            });
                          }}
                          disabled={!userProfileId} // Only require user ID for debug
                          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400"
                        >
                          🧪 Skip Payment (Debug)
                        </Button>
                      </div>

                      {/* Midtrans Payment Component */}
                      <div>
                        <MidtransPayment
                          bookingData={bookingData}
                          onSuccess={handlePaymentSuccess}
                          onPending={handlePaymentPending}
                          onError={handlePaymentError}
                          disabled={!isFormValid}
                        />
                      </div>
                    </div>

                    {/* Payment Security Notice */}
                    <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 rounded-lg">
                      🔒 Pembayaran aman diproses oleh Midtrans
                      <br />
                      Mendukung transfer bank, e-wallet, kartu kredit & debit
                      <br />
                      Data tersimpan aman di database terenkripsi
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
