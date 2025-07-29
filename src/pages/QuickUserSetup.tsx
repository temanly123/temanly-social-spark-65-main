import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainHeader from '@/components/MainHeader';
import { User, Mail, Lock, Shield } from 'lucide-react';

const QuickUserSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Amanda Soenoko',
    email: 'amandasoenoko@gmail.com',
    password: 'amanda123',
    userType: 'customer'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createUserAccount = async () => {
    setLoading(true);
    try {
      console.log('🔧 Creating user account:', formData.email);

      // First, try to sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            full_name: formData.name,
            user_type: formData.userType
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          // User already exists, try to update their password
          console.log('User already exists, attempting to sign in...');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (signInError) {
            throw new Error(`User exists but password doesn't match. Try a different password or use the existing one.`);
          }

          toast({
            title: "Account Ready!",
            description: `You can now login with ${formData.email} and the password you set.`,
            className: "bg-green-50 border-green-200"
          });

          // Sign out after verification
          await supabase.auth.signOut();
          return;
        } else {
          throw authError;
        }
      }

      if (authData.user) {
        console.log('✅ User created successfully:', authData.user.id);
        
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            user_type: formData.userType,
            verification_status: 'verified',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
          // Don't fail the whole process for profile errors
        }

        toast({
          title: "Account Created Successfully!",
          description: `Account created for ${formData.email}. You can now login with this email and password.`,
          className: "bg-green-50 border-green-200"
        });

        // Sign out the newly created user so they can login normally
        await supabase.auth.signOut();
      }

    } catch (error: any) {
      console.error('❌ Error creating user account:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login Test Successful!",
        description: `Successfully logged in as ${formData.email}`,
        className: "bg-green-50 border-green-200"
      });

      // Sign out immediately after test
      await supabase.auth.signOut();
      
    } catch (error: any) {
      console.error('Login test failed:', error);
      toast({
        title: "Login Test Failed",
        description: error.message || "Login failed. Try creating the account first.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                🚀 Quick User Account Setup
              </CardTitle>
              <p className="text-gray-600">
                Create your user account instantly without waiting for email verification
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Choose a password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a password you'll remember for logging in
                  </p>
                </div>

                <div>
                  <Label htmlFor="userType" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Account Type
                  </Label>
                  <Select value={formData.userType} onValueChange={(value) => handleInputChange('userType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer (Book talents)</SelectItem>
                      <SelectItem value="talent">Talent (Provide services)</SelectItem>
                      <SelectItem value="admin">Admin (Manage platform)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={createUserAccount} 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create My Account'
                  )}
                </Button>

                <Button 
                  onClick={testLogin} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Testing...' : 'Test Login'}
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Fill in your details above (email and password you want to use)</li>
                  <li>Click "Create My Account" to set up your account</li>
                  <li>Once created, go to the login page and use your email/password</li>
                  <li>You can use "Test Login" to verify your credentials work</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✅ After account creation:</h4>
                <p className="text-sm text-green-700">
                  Go to <strong>localhost:3000/login</strong> and use your email and password to sign in!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickUserSetup;
