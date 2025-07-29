
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationProps {
  email: string;
  onVerified: (success: boolean) => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onVerified }) => {
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedToken, setStoredToken] = useState('');
  const { toast } = useToast();

  const sendEmailCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: { email }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setStoredToken(data.token);
        setStep('verify');
        toast({
          title: "Email Terkirim",
          description: "Kode verifikasi telah dikirim ke email Anda",
          className: "bg-blue-50 border-blue-200"
        });
      } else {
        throw new Error(data.message || 'Gagal mengirim email verifikasi');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      toast({
        title: "Gagal Mengirim Email",
        description: error.message || "Terjadi kesalahan saat mengirim email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Kode Tidak Lengkap",
        description: "Masukkan kode 6 digit",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-token', {
        body: { 
          email,
          token: code 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Email Terverifikasi",
          description: "Email berhasil diverifikasi",
          className: "bg-green-50 border-green-200"
        });
        onVerified(true);
      } else {
        toast({
          title: "Kode Salah",
          description: data.message || "Kode verifikasi tidak sesuai",
          variant: "destructive"
        });
        onVerified(false);
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      toast({
        title: "Verifikasi Gagal",
        description: error.message || "Terjadi kesalahan saat memverifikasi kode",
        variant: "destructive"
      });
      onVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-blue-100 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Mail className="w-5 h-5 text-blue-600" />
          Verifikasi Email
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">Email: {email}</p>
        
        {step === 'send' ? (
          <Button 
            onClick={sendEmailCode} 
            disabled={isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Kode Email"
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Masukkan Kode 6 Digit:</label>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep('send')}
                className="flex-1"
              >
                Kirim Ulang
              </Button>
              <Button 
                onClick={verifyCode} 
                disabled={isLoading || code.length !== 6}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifikasi...
                  </>
                ) : (
                  "Verifikasi"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailVerification;
