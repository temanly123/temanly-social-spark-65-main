
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppVerificationProps {
  phone: string;
  onVerified: (success: boolean) => void;
}

const WhatsAppVerification: React.FC<WhatsAppVerificationProps> = ({ phone, onVerified }) => {
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedCode, setStoredCode] = useState('');
  const { toast } = useToast();

  const sendWhatsAppCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-verification', {
        body: {
          phone: phone,
          code: Math.floor(100000 + Math.random() * 900000).toString()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setStoredCode(data.code);
        setStep('verify');
        toast({
          title: "Kode Terkirim",
          description: "Kode verifikasi telah dikirim ke WhatsApp Anda",
          className: "bg-green-50 border-green-200"
        });
      } else {
        throw new Error(data.message || 'Gagal mengirim kode WhatsApp');
      }
    } catch (error: any) {
      console.error('WhatsApp verification error:', error);
      toast({
        title: "Gagal Mengirim Kode",
        description: error.message || "Terjadi kesalahan saat mengirim kode",
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
      if (code === storedCode) {
        toast({
          title: "WhatsApp Terverifikasi",
          description: "Nomor WhatsApp berhasil diverifikasi",
          className: "bg-green-50 border-green-200"
        });
        onVerified(true);
      } else {
        toast({
          title: "Kode Salah",
          description: "Kode verifikasi tidak sesuai",
          variant: "destructive"
        });
        onVerified(false);
      }
    } catch (error) {
      console.error('Code verification error:', error);
      toast({
        title: "Verifikasi Gagal",
        description: "Terjadi kesalahan saat memverifikasi kode",
        variant: "destructive"
      });
      onVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-green-100 bg-green-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <MessageSquare className="w-5 h-5 text-green-600" />
          Verifikasi WhatsApp
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">WhatsApp: {phone}</p>
        
        {step === 'send' ? (
          <Button 
            onClick={sendWhatsAppCode} 
            disabled={isLoading}
            className="w-full h-11 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Kode WhatsApp"
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
                className="flex-1 bg-green-600 hover:bg-green-700"
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

export default WhatsAppVerification;
