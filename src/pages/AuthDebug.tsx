import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createTestUsers, listUsers, resetUserPassword } from '@/utils/createTestUsers';
import { supabase } from '@/integrations/supabase/client';
import MainHeader from '@/components/MainHeader';

const AuthDebug = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('demo@temanly.com');
  const [testPassword, setTestPassword] = useState('demo123');

  const handleCreateTestUsers = async () => {
    setLoading(true);
    try {
      await createTestUsers();
      toast({
        title: "Test Users Created",
        description: "Test users have been created successfully.",
        className: "bg-green-50 border-green-200"
      });
      await handleListUsers();
    } catch (error) {
      console.error('Error creating test users:', error);
      toast({
        title: "Error",
        description: "Failed to create test users.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleListUsers = async () => {
    setLoading(true);
    try {
      const userList = await listUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error listing users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login Test Successful",
        description: `Successfully logged in as ${testEmail}`,
        className: "bg-green-50 border-green-200"
      });

      // Sign out immediately after test
      await supabase.auth.signOut();
      
    } catch (error: any) {
      console.error('Login test failed:', error);
      toast({
        title: "Login Test Failed",
        description: error.message || "Login failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Reset Email Sent",
        description: `Password reset email sent to ${testEmail}`,
        className: "bg-green-50 border-green-200"
      });
      
    } catch (error: any) {
      console.error('Password reset failed:', error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send password reset email",
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔧 Authentication Debug Panel</CardTitle>
              <p className="text-gray-600">Debug and test authentication functionality</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Test User Creation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Create Test Users</h3>
                <p className="text-sm text-gray-600">
                  This will create test users with the following credentials:
                </p>
                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <ul className="space-y-1">
                    <li><strong>demo@temanly.com</strong> - password: demo123 (customer)</li>
                    <li><strong>admin@temanly.com</strong> - password: admin123 (admin)</li>
                    <li><strong>talent@temanly.com</strong> - password: talent123 (talent)</li>
                    <li><strong>test@temanly.com</strong> - password: test123 (customer)</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleCreateTestUsers} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Test Users'}
                </Button>
              </div>

              {/* List Current Users */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Users</h3>
                <Button 
                  onClick={handleListUsers} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'List Current Users'}
                </Button>
                
                {users.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Users in Database:</h4>
                    <div className="space-y-2">
                      {users.map((user, index) => (
                        <div key={index} className="text-sm bg-white p-2 rounded border">
                          <strong>{user.email}</strong> - {user.name} ({user.user_type}) - {user.verification_status}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Login */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Login</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testEmail">Email</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email to test"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testPassword">Password</Label>
                    <Input
                      id="testPassword"
                      type="password"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      placeholder="Enter password to test"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleTestLogin} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Testing...' : 'Test Login'}
                </Button>
              </div>

              {/* Password Reset Test */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Password Reset</h3>
                <p className="text-sm text-gray-600">
                  Send a password reset email to the specified email address.
                </p>
                <Button 
                  onClick={handleSendPasswordReset} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Password Reset Email'}
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Instructions:</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>First, click "Create Test Users" to set up test accounts</li>
                  <li>Then try logging in with one of the test credentials</li>
                  <li>If login fails, use "Test Login" to debug the issue</li>
                  <li>Use "Send Password Reset Email" to test password reset functionality</li>
                  <li>Check your email for password reset links</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
