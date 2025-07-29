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
import { toast } from "@/components/ui/use-toast";
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Lock } from 'lucide-react';

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

const SimpleSignup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Email validation states
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  // Watch email field for changes
  const watchedEmail = form.watch('email');

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

  // Effect to check email availability when email changes
  useEffect(() => {
    if (watchedEmail && watchedEmail.includes('@')) {
      // Debounce the email check
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(watchedEmail);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
    }
  }, [watchedEmail]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if email is available before proceeding
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
      setIsLoading(true);
      console.log('Starting simple signup for:', values.email);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.name,
            user_type: 'user',
            phone: values.phone
          }
        }
      });

      if (authError) {
        throw authError;
      }

      console.log('Auth user created:', authData.user?.id);

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: values.name,
            email: values.email,
            phone: values.phone,
            user_type: 'user',
            verification_status: 'pending',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't fail the whole process for profile errors
        }
      }

      toast({
        title: "Akun Berhasil Dibuat!",
        description: "Silakan login dengan email dan password Anda.",
        className: "bg-green-50 border-green-200"
      });

      // Redirect to login instead of trying to auto-login
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <MainHeader />
      
      <div className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Akun Baru</h1>
            <p className="text-gray-600">Bergabung dengan Temanly sekarang</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-center text-xl text-gray-800">
                Buat Akun User
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <User className="w-4 h-4" />
                          Nama Lengkap
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Masukkan nama lengkap Anda" 
                            className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                            disabled={isLoading}
                          />
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
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <Mail className="w-4 h-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="contoh@email.com"
                            className={`h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 ${
                              emailCheckStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                              emailCheckStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                            }`}
                            disabled={isLoading}
                          />
                        </FormControl>
                        {emailCheckStatus !== 'idle' && (
                          <div className={`text-sm mt-1 ${
                            emailCheckStatus === 'taken' ? 'text-red-500' :
                            emailCheckStatus === 'available' ? 'text-green-500' :
                            emailCheckStatus === 'checking' ? 'text-blue-500' : 'text-gray-500'
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
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <Phone className="w-4 h-4" />
                          Nomor WhatsApp
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="08123456789" 
                            className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                            disabled={isLoading}
                          />
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
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <Lock className="w-4 h-4" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="password"
                            placeholder="Minimal 8 karakter" 
                            className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={isLoading || emailCheckStatus === 'taken' || emailCheckStatus === 'checking'}
                  >
                    {isLoading ? 'Membuat Akun...' :
                     emailCheckStatus === 'checking' ? 'Memeriksa Email...' :
                     emailCheckStatus === 'taken' ? 'Email Tidak Tersedia' :
                     'Daftar Sekarang'}
                  </Button>
                </form>
              </Form>

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SimpleSignup;
