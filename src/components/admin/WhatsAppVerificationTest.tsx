import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Phone,
  Shield
} from 'lucide-react';
import { TextMeBotService } from '@/services/textmebotService';
import { useToast } from '@/hooks/use-toast';

const WhatsAppVerificationTest = () => {
  const [phone, setPhone] = useState('081563961876');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);
  const { toast } = useToast();

  const checkApiStatus = async () => {
    setIsLoading(true);
    try {
      const status = await TextMeBotService.checkApiStatus();
      setApiStatus(status);
      
      toast({
        title: status ? "API Connected" : "API Offline",
        description: status ? "TextMeBot API is working" : "TextMeBot API is not responding",
        className: status ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      });
    } catch (error) {
      setApiStatus(false);
      toast({
        title: "API Check Failed",
        description: "Could not check TextMeBot API status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phone) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await TextMeBotService.sendVerificationCode(phone);
      
      if (result.success) {
        setSentCode(result.code || '');
        setStep('verify');
        
        toast({
          title: "Code Sent",
          description: result.message,
          className: "bg-green-50 border-green-200"
        });
      } else {
        toast({
          title: "Failed to Send",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await TextMeBotService.verifyCode(phone, verificationCode);
      
      if (result.success) {
        toast({
          title: "Verified!",
          description: result.message,
          className: "bg-green-50 border-green-200"
        });
        
        // Reset for next test
        setTimeout(() => {
          setStep('phone');
          setVerificationCode('');
          setSentCode('');
        }, 2000);
      } else {
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setStep('phone');
    setVerificationCode('');
    setSentCode('');
    setApiStatus(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              WhatsApp Verification Test
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Test TextMeBot WhatsApp verification integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            {apiStatus !== null && (
              <Badge variant={apiStatus ? "default" : "destructive"}>
                {apiStatus ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    API Online
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    API Offline
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Status Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">TextMeBot API Status</h4>
              <p className="text-sm text-blue-700">API Key: jYg9R67hoNMT</p>
            </div>
            <Button 
              onClick={checkApiStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Check Status"
              )}
            </Button>
          </div>
        </div>

        {step === 'phone' ? (
          /* Phone Input Step */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Indonesian format)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081563961876"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: 08xxxxxxxxxx or 62xxxxxxxxxx
              </p>
            </div>

            <Button 
              onClick={sendVerificationCode}
              disabled={isLoading || !phone}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send WhatsApp Code
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Verification Step */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Code sent to {phone}
                </span>
              </div>
              {sentCode && (
                <p className="text-sm text-green-700">
                  Demo code: <span className="font-mono font-bold">{sentCode}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="pl-10 text-center font-mono text-lg tracking-wider"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={resetTest}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={verifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Test Information:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Uses TextMeBot API for real WhatsApp messages</li>
            <li>• Fallback to demo codes if API is unavailable</li>
            <li>• Supports Indonesian phone number formats</li>
            <li>• Verification codes expire after 10 minutes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppVerificationTest;
