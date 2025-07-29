import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
// import { supabase } from '@/integrations/supabase/client';
import { Shield, Upload, Mail, Phone, IdCard, ArrowLeft } from 'lucide-react';

const SimpleUserVerification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailVerification = async () => {
    if (!user?.email) {
      toast({
        title: "No Email Found",
        description: "Please update your email address first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate email verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Email Verification Sent",
        description: "Please check your email for verification link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Save to database (temporarily disabled)
        // const { error } = await supabase
        //   .from('verification_documents')
        //   .upsert({
        //     user_id: user?.id,
        //     document_type: 'id_card',
        //     document_url: base64Data,
        //     file_name: file.name,
        //     file_size: file.size,
        //     content_type: file.type,
        //     status: 'pending'
        //   });

        // if (error) {
        //   throw error;
        // }

        // Simulate successful upload
        console.log('Document uploaded (simulated):', file.name);

        toast({
          title: "Document Uploaded",
          description: "Your ID card has been uploaded successfully.",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    setIsLoading(true);
    try {
      // Simulate database update
      // const { error } = await supabase
      //   .from('profiles')
      //   .update({
      //     verification_status: 'pending',
      //     verification_submitted_at: new Date().toISOString(),
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', user?.id);

      // if (error) {
      //   throw error;
      // }

      // Simulate successful submission
      console.log('Verification submitted (simulated) for user:', user?.email);

      toast({
        title: "Verification Submitted",
        description: "Your verification has been submitted for admin review.",
      });

      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/user-dashboard');
      }, 2000);

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submit Failed",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/user-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold">User Verification</h1>
              <p className="text-sm text-gray-600">Complete your identity verification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Identity Verification
            </CardTitle>
            <p className="text-gray-600">
              Complete these steps to access all services
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Verification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-semibold">1. Email Verification</h3>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Email: {user?.email}
                </p>
                <Button
                  onClick={handleEmailVerification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Email'}
                </Button>
              </div>
            </div>

            {/* Phone Verification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <h3 className="font-semibold">2. WhatsApp Verification</h3>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Phone: {user?.phone || 'Not provided'}
                </p>
                <Button
                  disabled={!user?.phone || isLoading}
                  className="w-full"
                >
                  Send WhatsApp Code
                </Button>
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5" />
                <h3 className="font-semibold">3. ID Card Upload</h3>
              </div>
              
              <div className="p-4 border rounded-lg">
                <Label htmlFor="id-upload" className="block text-sm font-medium mb-2">
                  Upload your ID Card (KTP)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="id-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 10MB. Supported formats: JPG, PNG
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmitVerification}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
              
              <p className="text-sm text-gray-500 text-center mt-2">
                Your verification will be reviewed by our admin team within 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleUserVerification;
