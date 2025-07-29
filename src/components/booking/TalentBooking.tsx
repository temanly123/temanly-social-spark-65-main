import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PaymentService } from '@/services/paymentService';
import { PaymentTransaction } from '@/types/payment';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Heart,
  MessageCircle,
  Phone,
  Video,
  Users,
  CreditCard,
  User
} from 'lucide-react';

interface Talent {
  id: string;
  name: string;
  age: number;
  location: string;
  rating: number;
  price_per_hour: number;
  avatar_url?: string;
  bio: string;
  services: string[];
  availability: string;
  level: 'Fresh' | 'Elite' | 'VIP';
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  icon: React.ReactNode;
}

const TalentBooking: React.FC = () => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    date: '',
    time: '',
    duration: 1,
    location: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Temanly services with production pricing
  const services: Service[] = [
    {
      id: 'chat',
      name: 'Chat',
      price: 25000,
      duration: 1,
      description: '25k per day - Text messaging and conversation',
      icon: <MessageCircle className="w-5 h-5" />
    },
    {
      id: 'call',
      name: 'Voice Call',
      price: 40000,
      duration: 1,
      description: '40k per hour - Voice conversation',
      icon: <Phone className="w-5 h-5" />
    },
    {
      id: 'video_call',
      name: 'Video Call',
      price: 65000,
      duration: 1,
      description: '65k per hour - Video conversation',
      icon: <Video className="w-5 h-5" />
    },
    {
      id: 'offline_date',
      name: 'Offline Date',
      price: 285000,
      duration: 3,
      description: '285k for 3 hours - In-person meeting',
      icon: <Heart className="w-5 h-5" />
    },
    {
      id: 'party_buddy',
      name: 'Party Buddy',
      price: 1000000,
      duration: 4,
      description: '1M per event - Party companion',
      icon: <Users className="w-5 h-5" />
    }
  ];

  // Fetch real talents from database
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'companion')
          .eq('status', 'active')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching talents:', error);
          return;
        }

        const transformedTalents: Talent[] = data?.map(talent => {
          console.log('🔄 TalentBooking transforming:', talent.name, 'Profile data:', talent.profile_data);

          return {
            id: talent.id,
            name: talent.name,
            age: talent.age,
            location: talent.location || talent.city,
            rating: talent.rating || 0,
            price_per_hour: talent.profile_data?.rent_lover_rate || talent.hourly_rate || 65000,
            bio: talent.bio,
            services: talent.profile_data?.available_services || [],
            availability: talent.is_available ? 'Available now' : 'Offline',
            level: talent.talent_level || 'Fresh'
          };
        }) || [];

        setTalents(transformedTalents);
      } catch (error) {
        console.error('Error fetching talents:', error);
      }
    };

    fetchTalents();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'VIP': return 'bg-purple-100 text-purple-800';
      case 'Elite': return 'bg-blue-100 text-blue-800';
      case 'Fresh': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommissionRate = (level: string) => {
    switch (level) {
      case 'VIP': return 15;
      case 'Elite': return 18;
      case 'Fresh': return 20;
      default: return 20;
    }
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;
    return selectedService.price * bookingDetails.duration;
  };

  const calculatePlatformFee = () => {
    const total = calculateTotal();
    return Math.round(total * 0.1); // 10% platform fee
  };

  const calculateTalentEarnings = () => {
    const total = calculateTotal();
    const platformFee = calculatePlatformFee();
    const commissionRate = selectedTalent ? getCommissionRate(selectedTalent.level) : 20;
    const commission = Math.round(total * (commissionRate / 100));
    return total - platformFee - commission;
  };

  const handleBooking = async () => {
    if (!selectedTalent || !selectedService) {
      toast({
        title: "Error",
        description: "Please select a talent and service",
        variant: "destructive"
      });
      return;
    }

    if (!bookingDetails.date || !bookingDetails.time) {
      toast({
        title: "Error",
        description: "Please select date and time",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create booking record
      const bookingData = {
        id: `BOOK_${Date.now()}`,
        user_id: user?.id || 'anonymous', // Get from auth context
        companion_id: selectedTalent.id,
        service: selectedService.name,
        service_date: bookingDetails.date,
        service_time: bookingDetails.time,
        duration: bookingDetails.duration,
        location: bookingDetails.location,
        notes: bookingDetails.notes,
        total_price: calculateTotal(),
        status: 'pending_payment',
        created_at: new Date().toISOString()
      };

      console.log('📝 Creating booking:', bookingData);

      // Prepare payment data for Midtrans
      const paymentData = {
        booking_data: {
          ...bookingData,
          talent: selectedTalent.name,
          service: selectedService.name,
          total: calculateTotal()
        },
        amount: calculateTotal(),
        order_id: bookingData.id
      };

      console.log('💳 Initiating payment:', paymentData);

      // Create payment transaction using new payment service
      try {
        const transactionData: Partial<PaymentTransaction> = {
          amount: calculateTotal(),
          service_name: selectedService.name,
          service_type: selectedService.type,
          duration: bookingDetails.duration,
          platform_fee: calculatePlatformFee(),
          companion_earnings: calculateTalentEarnings(),
          commission_rate: 15.0, // Default commission rate
          payment_status: 'pending',
          payment_method: 'midtrans',
          midtrans_order_id: paymentData.booking_id,
          companion_id: selectedTalent.id,
          // In real app, user_id would come from auth
          user_id: null
        };

        const transaction = await PaymentService.createPaymentTransaction(transactionData);
        console.log('✅ Payment transaction created:', transaction.id);

        // Call Supabase Edge Function to create Midtrans payment
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          throw new Error(`Payment creation failed: ${response.statusText}`);
        }

        const paymentResponse = await response.json();

        if (!paymentResponse.success) {
          throw new Error(paymentResponse.error || 'Payment creation failed');
        }

        console.log('✅ Payment created successfully:', paymentResponse);

        toast({
          title: "🎉 Booking Created!",
          description: `Order ID: ${paymentResponse.order_id}. Redirecting to payment...`,
          className: "bg-green-50 border-green-200"
        });

        // Open Midtrans payment page
        if (paymentResponse.redirect_url) {
          window.open(paymentResponse.redirect_url, '_blank');
        }

        // Reset form after successful payment creation
        setSelectedTalent(null);
        setSelectedService(null);
        setBookingDetails({
          date: '',
          time: '',
          duration: 1,
          notes: ''
        });

      } catch (paymentError) {
        console.error('❌ Payment creation error:', paymentError);
        toast({
          title: "Error",
          description: "Failed to create payment transaction",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Booking error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Perfect Companion</h1>
        <p className="text-gray-600">Choose from our verified talents and enjoy premium services</p>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Talent Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Talent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {talents.map((talent) => (
                  <div
                    key={talent.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTalent?.id === talent.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTalent(talent)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {talent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{talent.name}</h3>
                          <Badge className={getLevelColor(talent.level)}>
                            {talent.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{talent.rating}</span>
                          <span>•</span>
                          <MapPin className="w-3 h-3" />
                          <span>{talent.location}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{talent.bio}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-600">
                            {talent.availability}
                          </span>
                          <span className="text-sm font-semibold">
                            From Rp {talent.price_per_hour.toLocaleString('id-ID')}/hr
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Selection */}
          {selectedTalent && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Select Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services
                    .filter(service => selectedTalent.services.includes(service.id))
                    .map((service) => (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService?.id === service.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {service.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <p className="text-lg font-bold text-blue-600 mt-1">
                            Rp {service.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Details & Summary */}
        <div>
          {selectedTalent && selectedService && (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingDetails.date}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={bookingDetails.time}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Select
                    value={bookingDetails.duration.toString()}
                    onValueChange={(value) => setBookingDetails(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(hour => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour} hour{hour > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedService.id === 'offline_date' && (
                  <div>
                    <Label htmlFor="location">Meeting Location</Label>
                    <Input
                      id="location"
                      placeholder="Enter meeting location"
                      value={bookingDetails.location}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Special Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or notes..."
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">Price Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span>{selectedService.name} × {bookingDetails.duration}h</span>
                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform Fee (10%)</span>
                    <span>Rp {calculatePlatformFee().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Talent Commission ({getCommissionRate(selectedTalent.level)}%)</span>
                    <span>Rp {(calculateTotal() - calculatePlatformFee() - calculateTalentEarnings()).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Talent Earnings</span>
                    <span>Rp {calculateTalentEarnings().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Book & Pay Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentBooking;
