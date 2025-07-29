
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PaymentService } from '@/services/paymentService';
import { PaymentTransaction } from '@/types/payment';

const FinancialOverview = () => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    platformFees: 0,
    talentEarnings: 0,
    commissionRevenue: 0,
    totalPlatformRevenue: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
    fetchChartData();
    fetchServiceData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const analytics = await PaymentService.getPaymentAnalytics();

      const totalRevenue = analytics.total_revenue || 0;
      const totalTransactions = analytics.total_transactions || 0;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const platformFees = analytics.total_platform_fees || 0;
      const talentEarnings = analytics.total_companion_earnings || 0;
      const commissionRevenue = analytics.total_commission_revenue || (totalRevenue - platformFees - talentEarnings);
      const totalPlatformRevenue = analytics.total_platform_revenue || (platformFees + commissionRevenue);
      const monthlyRevenue = analytics.monthly_revenue || 0;

      setFinancialData({
        totalRevenue,
        monthlyRevenue,
        totalTransactions,
        averageTransaction,
        platformFees,
        talentEarnings,
        commissionRevenue,
        totalPlatformRevenue
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const transactions = await PaymentService.getPaymentTransactions({ limit: 100 });

      // Group transactions by month for the last 6 months
      const monthlyData: { [key: string]: number } = {};
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        monthlyData[monthKey] = 0;
        last6Months.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          revenue: 0
        });
      }

      // Aggregate transaction data by month
      transactions.forEach(transaction => {
        const transactionMonth = transaction.created_at.slice(0, 7);
        if (monthlyData.hasOwnProperty(transactionMonth)) {
          monthlyData[transactionMonth] += transaction.amount || 0;
        }
      });

      // Map data to chart format
      Object.keys(monthlyData).forEach((monthKey, index) => {
        if (last6Months[index]) {
          last6Months[index].revenue = monthlyData[monthKey];
        }
      });

      setChartData(last6Months);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchServiceData = async () => {
    try {
      const transactions = await PaymentService.getPaymentTransactions({ limit: 100 });

      // Aggregate by service
      const serviceRevenue: { [key: string]: number } = {};
      transactions.forEach(transaction => {
        const serviceName = transaction.service_name || 'Unknown';
        if (serviceRevenue[serviceName]) {
          serviceRevenue[serviceName] += transaction.amount || 0;
        } else {
          serviceRevenue[serviceName] = transaction.amount || 0;
        }
      });

      const serviceArray = Object.entries(serviceRevenue).map(([service, revenue]) => ({
        service,
        revenue
      }));

      setServiceData(serviceArray);
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading financial data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {financialData.totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {financialData.monthlyRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {Math.round(financialData.averageTransaction).toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {financialData.totalPlatformRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">Fees + Commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent Earnings</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              Rp {financialData.talentEarnings.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">Paid to talents</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No service data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialOverview;
