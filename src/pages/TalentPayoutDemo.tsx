import React from 'react';
import PayoutRequestDashboard from '@/components/talent/PayoutRequestDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TalentPayoutDemo: React.FC = () => {
  // Demo companion ID - in real app this would come from auth context
  const demoCompanionId = 'demo-companion-id';

  const handleBackToBooking = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleBackToBooking}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Booking
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Talent Payout Dashboard</h1>
                <p className="text-gray-600">Demo - Manage your earnings and payout requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="container mx-auto px-4 py-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Demo Mode</h3>
                <p className="text-blue-800 text-sm">
                  This is a demonstration of the talent payout system. In a real application, this would be integrated with authentication and show actual earnings data.
                </p>
                <div className="mt-2 text-xs text-blue-700">
                  <p>• Earnings data is simulated for demo purposes</p>
                  <p>• Payout requests will be created in the database</p>
                  <p>• Check the admin dashboard to see payout approval workflow</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4">
        <PayoutRequestDashboard companionId={demoCompanionId} />
      </div>
    </div>
  );
};

export default TalentPayoutDemo;
