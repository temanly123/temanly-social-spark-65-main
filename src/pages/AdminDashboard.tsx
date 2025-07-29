
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, TrendingUp, CreditCard, Settings, Users, DollarSign, Star, Activity, UserCog, Database, Calendar, MessageSquare, Wrench, FileText, CheckCircle, UserCheck } from 'lucide-react';

import FinancialManagement from '@/components/admin/FinancialManagement';
import TalentLevelManagement from '@/components/admin/TalentLevelManagement';
import ServiceAnalytics from '@/components/admin/ServiceAnalytics';
import RealTimeActivityMonitor from '@/components/admin/RealTimeActivityMonitor';
import SystemStats from '@/components/admin/SystemStats';
import UserManagement from '@/components/admin/UserManagement';
import TalentApprovalSystem from '@/components/admin/TalentApprovalSystem';
import AllUsersManagement from '@/components/admin/AllUsersManagement';
import BookingManagement from '@/components/admin/BookingManagement';
import ServiceManagement from '@/components/admin/ServiceManagement';
import ReviewManagement from '@/components/admin/ReviewManagement';
import DocumentManagement from '@/components/admin/DocumentManagement';
import DatabaseInspector from '@/components/admin/DatabaseInspector';
import DocumentRepairTool from '@/components/admin/DocumentRepairTool';

import DatabaseDiagnostic from '@/components/admin/DatabaseDiagnostic';
import SignupDocumentTester from '@/components/admin/SignupDocumentTester';
import RejectedDocumentCleaner from '@/components/admin/RejectedDocumentCleaner';
import TalentApplicationsManager from '@/components/admin/TalentApplicationsManager';
import TalentResetSystem from '@/components/admin/TalentResetSystem';

import AuthUserFixer from '@/components/admin/AuthUserFixer';

import WhatsAppVerificationTest from '@/components/admin/WhatsAppVerificationTest';
import NewTalentApprovalSystem from '@/components/admin/NewTalentApprovalSystem';


const AdminDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [activeTab, setActiveTab] = useState('talent-applications');

  const handleNavigateToTab = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  const handleSignOut = async () => {
    // Clear admin session and reload page
    localStorage.removeItem('temanly_admin_session');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Temanly Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Comprehensive Platform Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 Hari</SelectItem>
                  <SelectItem value="30days">30 Hari</SelectItem>
                  <SelectItem value="90days">90 Hari</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">


        {/* Real-Time System Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live System Overview</h2>
          <SystemStats />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-12 gap-1 h-auto p-2 bg-muted">
            <TabsTrigger value="talent-applications" className="flex items-center gap-2 text-xs">
              <Users className="w-4 h-4" />
              Talent Applications
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2 text-xs">
              <MessageSquare className="w-4 h-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 text-xs">
              <Wrench className="w-4 h-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="all-users" className="flex items-center gap-2 text-xs">
              <Database className="w-4 h-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2 text-xs">
              <Activity className="w-4 h-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 text-xs">
              <UserCog className="w-4 h-4" />
              User Mgmt
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="talents" className="flex items-center gap-2 text-xs">
              <Star className="w-4 h-4" />
              Talent Levels
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs">
              <Settings className="w-4 h-4" />
              Analytics
            </TabsTrigger>


            <TabsTrigger value="auth-fixer" className="flex items-center gap-2 text-xs">
              <Shield className="w-4 h-4" />
              Auth Fixer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="talent-applications">
            <TalentApplicationsManager />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              <WhatsAppVerificationTest />
              <DatabaseDiagnostic />
              <DocumentRepairTool />
              <DatabaseInspector />
              <RejectedDocumentCleaner />
              <SignupDocumentTester />
              <DocumentManagement />
            </div>
          </TabsContent>

          <TabsContent value="all-users">
            <AllUsersManagement />
          </TabsContent>

          <TabsContent value="monitor">
            <RealTimeActivityMonitor />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialManagement onNavigateToTab={handleNavigateToTab} />
          </TabsContent>

          <TabsContent value="talents">
            <TalentLevelManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <ServiceAnalytics />
          </TabsContent>



          <TabsContent value="auth-fixer">
            <AuthUserFixer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
