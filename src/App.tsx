
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";

// Import admin components
import AdminDashboard from './pages/AdminDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SimpleSignup from './pages/SimpleSignup';
import ResetPassword from './pages/ResetPassword';
import AuthDebug from './pages/AuthDebug';
import QuickUserSetup from './pages/QuickUserSetup';
import DatabaseSetup from './pages/DatabaseSetup';
import SimplePasswordReset from './pages/SimplePasswordReset';
import EmailTest from './pages/EmailTest';
import Index from './pages/Index';
import BrowseTalents from './pages/BrowseTalents';
import BookingPage from './pages/BookingPage';
import Chat from './pages/Chat';
// Demo pages removed for production
import UserDashboard from './pages/UserDashboard';
import Contact from './pages/Contact';
import Services from './pages/Services';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import Safety from './pages/Safety';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Help from './pages/Help';
import Community from './pages/Community';
import Rent from './pages/Rent';
import NotFound from './pages/NotFound';
import SimpleTalentRegistration from './components/SimpleTalentRegistration';
import TalentRegisterSuccess from './pages/TalentRegisterSuccess';
import TalentProfile from './pages/TalentProfile';
import TalentDocumentUpload from './pages/TalentDocumentUpload';
import DocumentVerification from '@/pages/DocumentVerification';
import TalentDashboard from './pages/TalentDashboard';
import UserVerification from './pages/UserVerification';
import TestVerification from './pages/TestVerification';
import SimpleUserVerification from './pages/SimpleUserVerification';
import StaticVerification from './pages/StaticVerification';
import AdminApp from './components/AdminApp';
import AmandaDiagnostic from './pages/AmandaDiagnostic';
import PaymentStatus from './pages/PaymentStatus';
// Demo payout page removed for production
import BookTalent from './pages/BookTalent';


import ReviewPage from './pages/ReviewPage';
import TalentLifecycleManager from './pages/TalentLifecycleManager';
import TalentLifecycleTest from './pages/TalentLifecycleTest';
import TalentDiagnostic from './pages/TalentDiagnostic';

import ReviewVerification from './pages/ReviewVerification';
import UserProfileDebug from './components/UserProfileDebug';



function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster />
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Demo routes removed for production */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/simple-signup" element={<SimpleSignup />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth-debug" element={<AuthDebug />} />
            <Route path="/quick-setup" element={<QuickUserSetup />} />
            <Route path="/database-setup" element={<DatabaseSetup />} />
            <Route path="/simple-reset" element={<SimplePasswordReset />} />
            <Route path="/email-test" element={<EmailTest />} />
            <Route path="/services" element={<Services />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<Help />} />
            <Route path="/community" element={<Community />} />
            <Route path="/rent" element={<Rent />} />
            <Route path="/talents" element={<BrowseTalents />} />
            <Route path="/browse-talents" element={<BrowseTalents />} />
            <Route path="/talent/:id" element={<TalentProfile />} />
            <Route path="/book-talent/:id" element={<BookTalent />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="/chat" element={<Chat />} />

            <Route path="/booking" element={<BookingPage />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/talent-dashboard" element={<TalentDashboard />} />
            <Route path="/user-verification" element={<StaticVerification />} />
            <Route path="/test-verification" element={<TestVerification />} />
            <Route path="/simple-user-verification" element={<SimpleUserVerification />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            {/* Demo payout route removed for production */}
            <Route path="/talent-register" element={<SimpleTalentRegistration />} />
            <Route path="/talent-register-success" element={<TalentRegisterSuccess />} />
            <Route path="/talent-document-upload" element={<TalentDocumentUpload />} />
            <Route path="/document-verification" element={<DocumentVerification />} />

            <Route path="/review/:bookingId" element={<ReviewPage />} />
            <Route path="/talent-lifecycle" element={<TalentLifecycleManager />} />
            <Route path="/talent-lifecycle-test" element={<TalentLifecycleTest />} />
            <Route path="/talent-diagnostic" element={<TalentDiagnostic />} />
            <Route path="/amanda-diagnostic" element={<AmandaDiagnostic />} />

            <Route path="/review-verification" element={<ReviewVerification />} />
            <Route path="/profile-debug" element={<UserProfileDebug />} />

            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
