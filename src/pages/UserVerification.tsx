
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Shield, Check, Phone, Mail, IdCard, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TextMeBotService } from '@/services/textmebotService';
import DocumentUpload from '@/components/DocumentUpload';

interface VerificationStatus {
  ktp_verified: boolean;
  email_verified: boolean;
  whatsapp_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  admin_notes?: string;
}

const UserVerification = () => {
  const [formData, setFormData] = useState({
    ktpFile: null as File | null,
    ktpUploaded: false,
    emailVerified: false,
    whatsappCode: '',
    whatsappVerified: false,
    whatsappCodeSent: false
  });
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    email: false,
    whatsapp: false,
    whatsappCode: false,
    submit: false
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Add error boundary
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Please try the simple verification instead.</p>
          <Button onClick={() => window.location.href = '/simple-user-verification'}>
            Try Simple Verification
          </Button>
        </div>
      </div>
    );
  }

  // Load current verification status
  useEffect(() => {
    const loadVerificationStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('ktp_verified, email_verified, whatsapp_verified, verification_status, admin_notes')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading verification status:', error);
          return;
        }

        if (data) {
          setVerificationStatus(data);
          setFormData(prev => ({
            ...prev,
            emailVerified: data.email_verified || false,
            whatsappVerified: data.whatsapp_verified || false,
            ktpUploaded: data.ktp_verified || false
          }));
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    loadVerificationStatus();
  }, [user]);

  const handleKtpUploadSuccess = (url: string) => {
    setFormData(prev => ({ ...prev, ktpUploaded: true }));
    toast({
      title: "KTP Uploaded Successfully",
      description: "Your KTP document has been uploaded and is pending admin verification.",
    });
  };

  const handleEmailVerification = async () => {
    if (!user?.email) {
      toast({
        title: "No Email Found",
        description: "Please update your email address in your profile first.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, email: true }));

    try {
      // Send email verification
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: user.email,
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your email and click the verification link.",
      });

    } catch (error) {
      console.error('Email verification error:', error);
      toast({
        title: "Email Verification Failed",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, email: false }));
    }
  };

  const sendWhatsAppCode = async () => {
    if (!user?.phone) {
      toast({
        title: "No Phone Number",
        description: "Please update your phone number in your profile first.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, whatsapp: true }));

    try {
      const result = await TextMeBotService.sendVerificationCode(user.phone);

      if (result.success) {
        setFormData(prev => ({ ...prev, whatsappCodeSent: true }));
        toast({
          title: "WhatsApp Code Sent",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('WhatsApp verification error:', error);
      toast({
        title: "WhatsApp Verification Failed",
        description: "Failed to send WhatsApp code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, whatsapp: false }));
    }
  };

  const verifyWhatsAppCode = async () => {
    if (!formData.whatsappCode) {
      toast({
        title: "Enter Verification Code",
        description: "Please enter the WhatsApp verification code.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.phone) {
      toast({
        title: "No Phone Number",
        description: "Phone number not found.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, whatsappCode: true }));

    try {
      const result = await TextMeBotService.verifyCode(user.phone, formData.whatsappCode);

      if (result.success) {
        // Update database
        const { error } = await supabase
          .from('profiles')
          .update({
            whatsapp_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          throw error;
        }

        setFormData(prev => ({ ...prev, whatsappVerified: true }));
        toast({
          title: "WhatsApp Verified",
          description: "Your WhatsApp number has been successfully verified.",
        });
      } else {
        toast({
          title: "Invalid Code",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('WhatsApp code verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify WhatsApp code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, whatsappCode: false }));
    }
  };

  const handleSubmitVerification = async () => {
    if (!formData.ktpUploaded || !formData.emailVerified || !formData.whatsappVerified) {
      toast({
        title: "Complete All Verification Steps",
        description: "Please complete KTP upload, email, and WhatsApp verification.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, submit: true }));

    try {
      // Update verification status to pending
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Send notification to admin
      await supabase.functions.invoke('notify-admin-verification', {
        body: {
          user_id: user?.id,
          user_name: user?.name || user?.email,
          verification_type: 'user'
        }
      });

      toast({
        title: "Verification Submitted",
        description: "Your verification documents have been submitted for admin review. You will be notified once approved.",
      });

      // Refresh verification status
      setVerificationStatus(prev => prev ? { ...prev, verification_status: 'pending' } : null);

    } catch (error) {
      console.error('Verification submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, submit: false }));
    }
  };

  const allVerified = formData.ktpUploaded && formData.emailVerified && formData.whatsappVerified;
  const isVerificationPending = verificationStatus?.verification_status === 'pending';
  const isVerified = verificationStatus?.verification_status === 'verified';
  const isRejected = verificationStatus?.verification_status === 'rejected';

  try {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="User Verification"
          subtitle="Complete your identity verification to access all services"
          backTo="/user-dashboard"
        />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Identity Verification
            </CardTitle>
            <p className="text-gray-600">
              Complete these steps to access Offline Date and Party Buddy services
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Verification Status */}
            {verificationStatus && (
              <div className="mb-6">
                {isVerified && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Account Verified</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">Your account has been successfully verified!</p>
                  </div>
                )}

                {isVerificationPending && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                      <span className="text-yellow-800 font-medium">Verification Pending</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">Your verification is being reviewed by our admin team.</p>
                  </div>
                )}

                {isRejected && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">Verification Rejected</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      {verificationStatus.admin_notes || 'Please review and resubmit your verification documents.'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* KTP Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5" />
                <h3 className="font-semibold">1. KTP/ID Card Upload</h3>
                {formData.ktpUploaded && <Check className="w-5 h-5 text-green-600" />}
              </div>

              {!formData.ktpUploaded ? (
                <DocumentUpload
                  onUploadSuccess={handleKtpUploadSuccess}
                  acceptedTypes={['image/*', '.pdf']}
                  maxSize={5}
                  label="Upload your KTP/ID Card"
                  description="Accepted formats: JPG, PNG, PDF (max 5MB)"
                />
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">KTP Uploaded Successfully</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">Your KTP document is pending admin verification.</p>
                </div>
              )}
            </div>

            {/* Email Verification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-semibold">2. Email Verification</h3>
                {formData.emailVerified && <Check className="w-5 h-5 text-green-600" />}
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Email: {user?.email}
                </p>
                <Button
                  onClick={handleEmailVerification}
                  disabled={formData.emailVerified || loadingStates.email}
                  className="w-full"
                >
                  {loadingStates.email ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : formData.emailVerified ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Email Verified
                    </>
                  ) : (
                    'Send Verification Email'
                  )}
                </Button>
              </div>
            </div>

            {/* WhatsApp Verification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <h3 className="font-semibold">3. WhatsApp Verification</h3>
                {formData.whatsappVerified && <Check className="w-5 h-5 text-green-600" />}
              </div>
              
              <div className="p-4 border rounded-lg space-y-3">
                <p className="text-sm text-gray-600">
                  WhatsApp: {user?.phone || 'Not provided'}
                </p>

                {!formData.whatsappCodeSent ? (
                  <Button
                    onClick={sendWhatsAppCode}
                    disabled={formData.whatsappVerified || loadingStates.whatsapp || !user?.phone}
                    className="w-full"
                  >
                    {loadingStates.whatsapp ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      'Send WhatsApp Code'
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-green-600">
                      ✓ Verification code sent to your WhatsApp
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter verification code"
                        value={formData.whatsappCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsappCode: e.target.value }))}
                        disabled={formData.whatsappVerified}
                      />
                      <Button
                        onClick={verifyWhatsAppCode}
                        disabled={formData.whatsappVerified || loadingStates.whatsappCode || !formData.whatsappCode}
                      >
                        {loadingStates.whatsappCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : formData.whatsappVerified ? (
                          <>
                            <Check className="w-4 h-4" />
                          </>
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={sendWhatsAppCode}
                      disabled={loadingStates.whatsapp}
                      size="sm"
                    >
                      Resend Code
                    </Button>
                  </div>
                )}

                {formData.whatsappVerified && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm font-medium">WhatsApp Verified</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmitVerification}
                disabled={!allVerified || loadingStates.submit || isVerificationPending || isVerified}
                className="w-full"
                size="lg"
              >
                {loadingStates.submit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isVerified ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : isVerificationPending ? (
                  'Verification Pending'
                ) : (
                  'Submit for Verification'
                )}
              </Button>

              {allVerified && !isVerificationPending && !isVerified && (
                <p className="text-sm text-green-600 text-center mt-2">
                  All verification steps completed! Ready to submit.
                </p>
              )}

              {!allVerified && !isVerified && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Complete all verification steps to submit your application.
                </p>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
    );
  } catch (error) {
    console.error('UserVerification render error:', error);
    setHasError(true);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Verification Error</h2>
          <p className="text-gray-600 mb-4">Please try the simple verification instead.</p>
          <Button onClick={() => window.location.href = '/simple-user-verification'}>
            Try Simple Verification
          </Button>
        </div>
      </div>
    );
  }
};

export default UserVerification;
