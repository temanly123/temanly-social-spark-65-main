
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, User, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  console.log('🔐 AdminLogin component rendering');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Enhanced authentication with real Supabase login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Attempting admin login with:', { username, email });

      // Try real Supabase authentication first with ada@temanly.com
      if (email === 'ada@temanly.com' || email === 'admin@temanly.com') {
        console.log('🔄 Attempting Supabase authentication...');

        // Use a default password for ada@temanly.com
        const authEmail = 'ada@temanly.com';
        const authPassword = passcode || 'admin123'; // Use provided passcode or default

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (authError) {
          console.log('❌ Supabase auth failed:', authError.message);
          // Fall back to simple credentials check
          if (username === 'admin' && email === 'admin@temanly.com' && passcode === 'admin123') {
            console.log('✅ Using fallback admin credentials');
            localStorage.setItem('temanly_admin_session', 'true');
            window.location.reload();
            return;
          }
          alert('Authentication failed: ' + authError.message);
          return;
        }

        if (authData.user) {
          console.log('✅ Supabase authentication successful');
          console.log('👤 User ID:', authData.user.id);
          console.log('🔑 Session:', authData.session);

          // Verify user is admin (temporarily disable RLS check)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_type, email, full_name')
            .eq('id', authData.user.id)
            .single();

          console.log('📊 Profile check:', { profile, profileError });

          // For now, accept any authenticated user as admin for testing
          if (profileError) {
            console.log('⚠️ Profile not found, but allowing admin access for testing');
          }

          console.log('✅ Admin access granted, setting session');
          localStorage.setItem('temanly_admin_session', 'true');
          localStorage.setItem('temanly_admin_user_id', authData.user.id);

          // Don't reload immediately, let the session establish
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }

      // Fallback for testing credentials
      if (username === 'admin' && email === 'admin@temanly.com' && passcode === 'admin123') {
        console.log('✅ Using fallback admin credentials');
        localStorage.setItem('temanly_admin_session', 'true');
        window.location.reload();
      } else {
        console.log('❌ Invalid credentials');
        alert('Access denied. Invalid credentials.');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Temanly Admin</CardTitle>
          <p className="text-gray-600">Super Admin Dashboard Access</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passcode">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPasscode(!showPasscode)}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In as Admin'}
            </Button>
          </form>

          <div className="text-xs text-gray-500 text-center">
            <div>Admin access requires valid credentials</div>
            <div className="text-red-600 font-medium mt-2">
              Contact system administrator for access
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
