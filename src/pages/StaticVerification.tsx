import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Upload, Mail, Phone, IdCard, ArrowLeft, CheckCircle } from 'lucide-react';

const StaticVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    verificationCode: '',
    idCard: null as File | null
  });

  const handleEmailSubmit = () => {
    if (formData.email) {
      alert(`Verification email sent to ${formData.email}`);
      setStep(2);
    }
  };

  const handlePhoneSubmit = () => {
    if (formData.phone) {
      alert(`WhatsApp code sent to ${formData.phone}`);
      setStep(3);
    }
  };

  const handleCodeVerify = () => {
    if (formData.verificationCode) {
      alert('WhatsApp verified successfully!');
      setStep(4);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, idCard: file }));
      alert(`ID Card uploaded: ${file.name}`);
    }
  };

  const handleFinalSubmit = () => {
    alert('Verification submitted successfully! You will be notified once approved.');
    navigate('/user-dashboard');
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
              Identity Verification - Step {step} of 4
            </CardTitle>
            <p className="text-gray-600">
              Complete these steps to access all services
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Email Verification */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <h3 className="font-semibold">1. Email Verification</h3>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    className="mb-3"
                  />
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!formData.email}
                    className="w-full"
                  >
                    Send Verification Email
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Phone Number */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">Email verification sent</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  <h3 className="font-semibold">2. WhatsApp Verification</h3>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="phone" className="block text-sm font-medium mb-2">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08123456789"
                    className="mb-3"
                  />
                  <Button
                    onClick={handlePhoneSubmit}
                    disabled={!formData.phone}
                    className="w-full"
                  >
                    Send WhatsApp Code
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Verification Code */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">WhatsApp code sent</span>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="code" className="block text-sm font-medium mb-2">
                    Enter Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    value={formData.verificationCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, verificationCode: e.target.value }))}
                    placeholder="Enter 6-digit code"
                    className="mb-3"
                  />
                  <Button
                    onClick={handleCodeVerify}
                    disabled={!formData.verificationCode}
                    className="w-full"
                  >
                    Verify Code
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">WhatsApp verified</span>
                </div>
                
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
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum file size: 10MB. Supported formats: JPG, PNG
                  </p>
                  
                  {formData.idCard && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">File uploaded: {formData.idCard.name}</span>
                      </div>
                      
                      <Button
                        onClick={handleFinalSubmit}
                        className="w-full mt-4"
                        size="lg"
                      >
                        Submit for Verification
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress indicator */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Step {step} of 4</span>
                <span>{Math.round((step / 4) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaticVerification;
