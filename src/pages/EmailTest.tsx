import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainHeader from '@/components/MainHeader';
import { Mail, CheckCircle, AlertCircle, Settings } from 'lucide-react';

const EmailTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('amandasoenoko@gmail.com');
  const [testResults, setTestResults] = useState<any[]>([]);

  const testPasswordReset = async () => {
    setLoading(true);
    const testResult = {
      timestamp: new Date().toLocaleTimeString(),
      email: email,
      status: 'pending',
      message: '',
      error: null
    };

    try {
      console.log('🧪 Testing password reset email for:', email);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      testResult.status = 'success';
      testResult.message = 'Password reset email sent successfully! Check your inbox.';
      
      toast({
        title: "Email Sent Successfully!",
        description: "Check your email inbox (and spam folder) for the password reset link.",
        className: "bg-green-50 border-green-200"
      });

      console.log('✅ Password reset email sent successfully');

    } catch (error: any) {
      console.error('❌ Password reset email failed:', error);
      
      testResult.status = 'error';
      testResult.error = error.message;
      testResult.message = `Failed: ${error.message}`;

      toast({
        title: "Email Failed to Send",
        description: error.message || "Failed to send password reset email. Check SMTP configuration.",
        variant: "destructive"
      });
    } finally {
      setTestResults(prev => [testResult, ...prev]);
      setLoading(false);
    }
  };

  const testSignUp = async () => {
    setLoading(true);
    const testEmail = `test+${Date.now()}@example.com`;
    const testResult = {
      timestamp: new Date().toLocaleTimeString(),
      email: testEmail,
      status: 'pending',
      message: '',
      error: null,
      type: 'signup'
    };

    try {
      console.log('🧪 Testing signup confirmation email for:', testEmail);

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }

      testResult.status = 'success';
      testResult.message = 'Signup confirmation email sent successfully!';
      
      toast({
        title: "Signup Email Sent!",
        description: "Test signup confirmation email was sent successfully.",
        className: "bg-green-50 border-green-200"
      });

      console.log('✅ Signup confirmation email sent successfully');

    } catch (error: any) {
      console.error('❌ Signup email failed:', error);
      
      testResult.status = 'error';
      testResult.error = error.message;
      testResult.message = `Failed: ${error.message}`;

      toast({
        title: "Signup Email Failed",
        description: error.message || "Failed to send signup confirmation email.",
        variant: "destructive"
      });
    } finally {
      setTestResults(prev => [testResult, ...prev]);
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                📧 Email Service Test
              </CardTitle>
              <p className="text-gray-600">
                Test your Supabase email configuration to ensure password reset emails are working
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Test Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={testPasswordReset}
                  disabled={loading || !email}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </div>
                  ) : (
                    'Test Password Reset Email'
                  )}
                </Button>

                <Button 
                  onClick={testSignUp}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  Test Signup Email
                </Button>

                <Button 
                  onClick={clearResults}
                  variant="outline"
                  disabled={testResults.length === 0}
                >
                  Clear Results
                </Button>
              </div>

              {/* Configuration Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuration Checklist
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>✅ Supabase project: enyrffgedfvgunokpmqk</li>
                  <li>⚠️ SMTP Settings: Check Supabase Dashboard → Settings → Auth → SMTP</li>
                  <li>⚠️ Email Templates: Check Supabase Dashboard → Settings → Auth → Email Templates</li>
                  <li>📧 Gmail App Password: Required if using Gmail SMTP</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.status === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : result.status === 'error'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {result.type === 'signup' ? 'Signup Email Test' : 'Password Reset Email Test'}
                              </p>
                              <p className="text-sm text-gray-600">
                                To: {result.email} • {result.timestamp}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              result.status === 'success' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                          <p className="text-sm mt-2">{result.message}</p>
                          {result.error && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">Error Details</summary>
                              <pre className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded overflow-auto">
                                {result.error}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 Quick Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">If emails are not working:</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://supabase.com/dashboard/project/enyrffgedfvgunokpmqk/settings/auth" target="_blank" rel="noopener noreferrer" className="underline">Supabase Auth Settings</a></li>
                  <li>Configure SMTP settings with Gmail or another email provider</li>
                  <li>Set up email templates for password reset</li>
                  <li>Test again using this page</li>
                </ol>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✅ When emails work:</h4>
                <p className="text-sm text-green-700">
                  Go to your login page and use the "Reset password" feature. You'll receive real emails in your inbox!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;
