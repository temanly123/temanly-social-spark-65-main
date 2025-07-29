
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceData {
  name: string;
  orders: number;
  revenue: number;
  popularity: number;
  avgDuration: string;
  color: string;
}

interface CityData {
  city: string;
  orders: number;
  revenue: number;
}

const ServiceAnalytics = () => {
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch transaction data from payment_transactions table
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('transaction_type, amount, created_at, status');

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        // Don't throw error, just handle gracefully
        setServiceData([]);
        setCityData([]);
        setLoading(false);
        return;
      }

      // Fetch profile data for city information
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('city, user_type');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Don't throw error, just handle gracefully
        setCityData([]);
      }

      // Handle empty transactions gracefully
      const safeTransactions = transactions || [];

      // Process service data
      const serviceStats: { [key: string]: { orders: number; revenue: number } } = {};
      const totalOrders = safeTransactions.length;
      const totalRevenue = safeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      safeTransactions.forEach(transaction => {
        // Use transaction_type instead of service field
        const service = transaction.transaction_type || 'General Service';
        if (!serviceStats[service]) {
          serviceStats[service] = { orders: 0, revenue: 0 };
        }
        serviceStats[service].orders += 1;
        serviceStats[service].revenue += transaction.amount || 0;
      });

      // Convert to service data array with colors
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];
      const services: ServiceData[] = Object.entries(serviceStats).map(([service, stats], index) => ({
        name: service,
        orders: stats.orders,
        revenue: stats.revenue,
        popularity: totalOrders > 0 ? Math.round((stats.orders / totalOrders) * 100) : 0,
        avgDuration: getServiceDuration(service),
        color: colors[index % colors.length]
      }));

      // Sort by revenue
      services.sort((a, b) => b.revenue - a.revenue);
      setServiceData(services);

      // Process city data
      const safeProfiles = profiles || [];
      const cityStats: { [key: string]: number } = {};
      safeProfiles.forEach(profile => {
        if (profile.city && profile.user_type === 'user') {
          cityStats[profile.city] = (cityStats[profile.city] || 0) + 1;
        }
      });

      // Convert to city data array (mock revenue for now since we don't have city-specific transaction data)
      const cities: CityData[] = Object.entries(cityStats)
        .map(([city, userCount]) => ({
          city,
          orders: userCount,
          revenue: userCount * 75000 // Mock average revenue per user
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setCityData(cities);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Don't show error toast for empty data, just set empty states
      setServiceData([]);
      setCityData([]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceDuration = (service: string): string => {
    // Default durations based on transaction type
    const durations: { [key: string]: string } = {
      'booking_payment': '2-4 jam',
      'service_payment': '1-3 jam',
      'subscription_payment': '30 hari',
      'tip_payment': 'Instant',
      'General Service': '1-2 jam'
    };
    return durations[service] || '1 jam';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading analytics data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = serviceData.reduce((sum, service) => sum + service.revenue, 0);
  const totalOrders = serviceData.reduce((sum, service) => sum + service.orders, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  Rp {totalRevenue > 0 ? (totalRevenue / 1000000).toFixed(1) : '0'}M
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  Rp {totalOrders > 0 ? Math.round(totalRevenue / totalOrders / 1000) : '0'}k
                </div>
                <div className="text-sm text-gray-600">Avg Order Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{cityData.length}</div>
                <div className="text-sm text-gray-600">Active Cities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {serviceData.length > 0 ? (
        <>
          {/* Service Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip 
                      formatter={(value: number) => [`Rp ${(value / 1000000).toFixed(1)}M`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="popularity"
                      label={({ name, popularity }) => `${name}: ${popularity}%`}
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Service Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Service Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceData.map((service) => (
                  <div key={service.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: service.color }}
                        ></div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <Badge variant="outline">{service.popularity}% market share</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">Rp {(service.revenue / 1000000).toFixed(1)}M</div>
                        <div className="text-sm text-gray-600">{service.orders} orders</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Average Duration: </span>
                        <span className="font-medium">{service.avgDuration}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue per Order: </span>
                        <span className="font-medium">
                          Rp {service.orders > 0 ? Math.round(service.revenue / service.orders / 1000) : 0}k
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Orders: </span>
                        <span className="font-medium">{service.orders} transactions</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Service Data Found</h3>
            <p className="text-gray-500">No transaction data available for analytics.</p>
          </CardContent>
        </Card>
      )}

      {/* City Performance */}
      {cityData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {cityData.map((city) => (
                <div key={city.city} className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">{city.city}</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    Rp {(city.revenue / 1000000).toFixed(0)}M
                  </div>
                  <div className="text-sm text-gray-600">{city.orders} users</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: Rp {Math.round(city.revenue / city.orders / 1000)}k/user
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceAnalytics;
