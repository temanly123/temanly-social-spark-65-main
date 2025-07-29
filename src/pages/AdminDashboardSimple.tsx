import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AdminDashboardSimple = () => {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    // Load applications from localStorage
    const stored = localStorage.getItem('talent-applications');
    if (stored) {
      try {
        const apps = JSON.parse(stored);
        setApplications(apps || []);
      } catch (error) {
        console.error('Error loading applications:', error);
        setApplications([]);
      }
    }
  }, []);

  const handleApprove = (appId: string) => {
    try {
      const updatedApps = applications.map(app => 
        app.id === appId ? { ...app, status: 'approved' } : app
      );
      setApplications(updatedApps);
      localStorage.setItem('talent-applications', JSON.stringify(updatedApps));
      alert('✅ Application approved successfully!');
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error approving application');
    }
  };

  const handleReject = (appId: string) => {
    try {
      const updatedApps = applications.filter(app => app.id !== appId);
      setApplications(updatedApps);
      localStorage.setItem('talent-applications', JSON.stringify(updatedApps));
      alert('🗑️ Application rejected and deleted successfully!');
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_admin_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🛡️ Temanly Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage talent applications and platform settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{applications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⏳ Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending_admin_review').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✅ Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {applications.filter(app => app.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📝 Talent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No applications found.</p>
                <p className="text-sm mt-2">Applications will appear here when users submit the talent registration form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{app.personalInfo?.name || 'N/A'}</h4>
                        <p className="text-gray-600">{app.personalInfo?.email || 'N/A'}</p>
                        <p className="text-gray-600">{app.personalInfo?.phone || 'N/A'}</p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>📍 Location: {app.personalInfo?.location || 'N/A'}</p>
                      <p>🎯 Services: {app.services?.availableServices?.length || 0}</p>
                      <p>📅 Applied: {new Date(app.timestamp).toLocaleDateString()}</p>
                    </div>

                    {app.status === 'pending_admin_review' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(app.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          ✅ Approve
                        </Button>
                        <Button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to reject and delete this application?\n\nTalent: ${app.personalInfo?.name || 'Unknown'}\n\nThis action cannot be undone.`)) {
                              handleReject(app.id);
                            }
                          }}
                          variant="destructive"
                        >
                          🗑️ Reject & Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={() => {
              localStorage.removeItem('temanly_admin_session');
              window.location.reload();
            }}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            🚪 Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSimple;
