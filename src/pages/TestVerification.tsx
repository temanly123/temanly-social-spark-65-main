import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Test Verification Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This is a test verification page to check if navigation works.</p>
            <div className="space-y-4">
              <Button onClick={() => navigate('/user-dashboard')} className="w-full">
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate('/user-verification')} className="w-full">
                Go to Real Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestVerification;
