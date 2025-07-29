import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DocumentUpload from '@/components/DocumentUpload';
import EmailVerification from '@/components/EmailVerification';
import WhatsAppVerification from '@/components/WhatsAppVerification';
import { User, Mail, Phone, Shield, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nama harus minimal 2 karakter.",
  }),
  email: z.string().email({
    message: "Format email tidak valid.",
  }),
  phone: z.string().min(10, {
    message: "Nomor WhatsApp harus minimal 10 angka.",
  }),
  password: z.string().min(8, {
    message: "Password harus minimal 8 karakter.",
  }),
});

type SignupStep = 'basic-info' | 'verification' | 'complete';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, user } = useAuth();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<SignupStep>('basic-info');
  const [signupData, setSignupData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation states
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');

  // Verification states
  const [verificationStates, setVerificationStates] = useState({
    email: false,
    whatsapp: false,
    ktp: false
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User already authenticated, redirecting to dashboard');
      // Add a delay to prevent infinite loops
      const timer = setTimeout(() => {
        navigate('/user-dashboard', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate]);

  const watchedValues = form.watch();

  // Function to check if email already exists
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }

    setEmailCheckStatus('checking');
    setEmailCheckMessage('Memeriksa ketersediaan email...');

    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('email, user_type, verification_status, status')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        setEmailCheckStatus('error');
        setEmailCheckMessage('Gagal memeriksa email. Silakan coba lagi.');
        return;
      }

      if (profilesData) {
        // Email is already registered - check if it's for a different user type
        const existingUserType = profilesData.user_type;
        const requestedUserType = 'user'; // This is user registration

        if (existingUserType !== requestedUserType) {
          // Allow different user types with same email
          setEmailCheckStatus('available');
          setEmailCheckMessage('✅ Email tersedia untuk registrasi user');
        } else {
          // Same user type
          const statusText = profilesData.verification_status === 'pending' ? 'sedang menunggu verifikasi' : 'sudah terverifikasi';
          setEmailCheckStatus('taken');
          setEmailCheckMessage(`❌ Email sudah terdaftar dan ${statusText}. Silakan login dengan akun yang sudah ada.`);
        }
      } else {
        // Email is available
        setEmailCheckStatus('available');
        setEmailCheckMessage('✅ Email tersedia');
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      setEmailCheckStatus('error');
      setEmailCheckMessage('Gagal memeriksa email. Silakan coba lagi.');
    }
  };

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedValues.email) {
        checkEmailAvailability(watchedValues.email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedValues.email]);

  const handleBasicInfoSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if email is available
    if (emailCheckStatus === 'taken') {
      toast({
        title: "Email Tidak Tersedia",
        description: emailCheckMessage,
        variant: "destructive"
      });
      return;
    }

    if (emailCheckStatus === 'checking') {
      toast({
        title: "Tunggu Sebentar",
        description: "Masih memeriksa ketersediaan email. Silakan tunggu sebentar.",
        variant: "default"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Starting registration with AuthContext');

      // Use the AuthContext signup method
      const result = await signup({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        user_type: 'user',
        additionalData: {
          hasIdCard: false
        }
      });

      console.log('Registration completed successfully', result);

      // Store signup data and move to verification step
      setSignupData(result);
      setCurrentStep('verification');

      toast({
        title: "Akun Berhasil Dibuat!",
        description: "Sekarang lengkapi verifikasi untuk mengakses semua layanan.",
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationComplete = () => {
    setCurrentStep('complete');
  };

  const handleSkipToComplete = () => {
    // For regular users, allow skipping verification entirely
    toast({
      title: "Pendaftaran Berhasil!",
      description: "Anda dapat melengkapi verifikasi nanti di dashboard.",
    });
    setCurrentStep('complete');
  };

  const handleFinish = () => {
    // Add a small delay to ensure auth state is properly set
    setTimeout(() => {
      navigate('/user-dashboard', { replace: true });
    }, 500);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'basic-info' ? 'bg-blue-600 text-white' :
            currentStep === 'verification' || currentStep === 'complete' ? 'bg-green-600 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {currentStep === 'verification' || currentStep === 'complete' ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium">Info Dasar</span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'verification' ? 'bg-blue-600 text-white' :
            currentStep === 'complete' ? 'bg-green-600 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {currentStep === 'complete' ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="ml-2 text-sm font-medium">Verifikasi</span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        {/* Step 3 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Selesai</span>
        </div>
      </div>
    </div>
  );

  const renderBasicInfoStep = () => (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Informasi Dasar
        </CardTitle>
        <p className="text-gray-600 text-sm">Masukkan data pribadi Anda</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBasicInfoSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Masukkan nama lengkap" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contoh@email.com"
                      className={`${
                        emailCheckStatus === 'taken' ? 'border-red-500' :
                        emailCheckStatus === 'available' ? 'border-green-500' : ''
                      }`}
                    />
                  </FormControl>
                  {emailCheckStatus !== 'idle' && (
                    <div className={`text-sm ${
                      emailCheckStatus === 'taken' ? 'text-red-500' :
                      emailCheckStatus === 'available' ? 'text-green-500' :
                      'text-blue-500'
                    }`}>
                      {emailCheckMessage}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor WhatsApp</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="08xxxxxxxxxx" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Minimal 8 karakter" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={emailCheckStatus === 'taken' || emailCheckStatus === 'checking' || isSubmitting}
            >
              {isSubmitting ? 'Membuat Akun...' :
               emailCheckStatus === 'checking' ? 'Memeriksa Email...' :
               'Lanjutkan ke Verifikasi'}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderVerificationStep = () => (
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Verifikasi Identitas
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Lengkapi verifikasi untuk mengakses semua layanan Temanly
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Verification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <h3 className="font-semibold">1. Verifikasi Email</h3>
            {verificationStates.email && <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Terverifikasi
            </Badge>}
          </div>
          <EmailVerification
            onVerificationComplete={() => setVerificationStates(prev => ({ ...prev, email: true }))}
          />
        </div>

        {/* WhatsApp Verification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            <h3 className="font-semibold">2. Verifikasi WhatsApp</h3>
            {verificationStates.whatsapp && <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Terverifikasi
            </Badge>}
          </div>
          <WhatsAppVerification
            onVerificationComplete={() => setVerificationStates(prev => ({ ...prev, whatsapp: true }))}
          />
        </div>

        {/* KTP Upload */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <h3 className="font-semibold">3. Upload KTP (Opsional)</h3>
            {verificationStates.ktp && <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Terupload
            </Badge>}
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Upload KTP untuk mengakses layanan Offline Date dan Party Buddy
            </p>
            <DocumentUpload
              onUploadSuccess={() => setVerificationStates(prev => ({ ...prev, ktp: true }))}
              acceptedTypes={['image/*', '.pdf']}
              maxSize={5}
              label="Upload KTP"
              description="Format: JPG, PNG, PDF (max 5MB)"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('basic-info')}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Button
            onClick={handleVerificationComplete}
            className="flex-1"
          >
            Lanjutkan
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Skip Option for Regular Users */}
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={handleSkipToComplete}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Lewati verifikasi untuk sekarang
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            Anda dapat melengkapi verifikasi nanti di dashboard
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {verificationStates.email && verificationStates.whatsapp ?
              "Semua verifikasi wajib selesai! Anda bisa melanjutkan." :
              "Selesaikan verifikasi email dan WhatsApp untuk melanjutkan."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-green-800">Pendaftaran Berhasil!</CardTitle>
        <p className="text-gray-600 text-sm">
          Akun Anda telah berhasil dibuat dan siap digunakan
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Yang Sudah Anda Selesaikan:</h4>
          <ul className="space-y-1 text-sm text-green-700">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              Akun berhasil dibuat
            </li>
            {verificationStates.email && (
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3" />
                Email terverifikasi
              </li>
            )}
            {verificationStates.whatsapp && (
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3" />
                WhatsApp terverifikasi
              </li>
            )}
            {verificationStates.ktp && (
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3" />
                KTP terupload
              </li>
            )}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Langkah Selanjutnya:</h4>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Lengkapi profil Anda</li>
            <li>• Jelajahi talent yang tersedia</li>
            <li>• Mulai booking layanan</li>
            {!verificationStates.ktp && (
              <li>• Upload KTP untuk akses layanan premium</li>
            )}
          </ul>
        </div>

        <Button onClick={handleFinish} className="w-full" size="lg">
          Masuk ke Dashboard
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Selamat datang di Temanly! 🎉
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Add error boundary and debugging
  console.log('Signup render:', { currentStep, isAuthenticated, user: user?.email });

  // Simple fallback if there are issues
  if (!currentStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
          <Button onClick={() => setCurrentStep('basic-info')}>
            Start Signup
          </Button>
        </div>
      </div>
    );
  }

  // If there's an error, show a fallback
  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <MainHeader />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            {renderStepIndicator()}

            <div className="flex justify-center">
              {currentStep === 'basic-info' && renderBasicInfoStep()}
              {currentStep === 'verification' && renderVerificationStep()}
              {currentStep === 'complete' && renderCompleteStep()}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Signup render error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Please try the simple signup instead.</p>
          <Button onClick={() => navigate('/simple-signup')}>
            Try Simple Signup
          </Button>
        </div>
      </div>
    );
  }
};

export default Signup;