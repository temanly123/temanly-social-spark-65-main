import { supabase } from '@/integrations/supabase/client';

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  resetUrl?: string; // For development mode
}

export interface ResetTokenValidation {
  isValid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

class PasswordResetService {
  
  /**
   * Send password reset email using custom service
   */
  async sendPasswordResetEmail(email: string): Promise<PasswordResetResponse> {
    try {
      console.log('🔄 Sending password reset request for:', email);

      // First try Supabase's built-in password reset
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (!supabaseError) {
        console.log('✅ Supabase password reset email sent successfully');
        return {
          success: true,
          message: "Password reset email sent! Please check your inbox and spam folder."
        };
      }

      console.log('⚠️ Supabase email failed, trying custom service:', supabaseError.message);

      // If Supabase fails, try our custom function
      const { data, error } = await supabase.functions.invoke('custom-password-reset', {
        body: { email }
      });

      if (error) {
        console.error('❌ Custom password reset failed:', error);
        throw new Error(error.message || 'Failed to send password reset email');
      }

      console.log('✅ Custom password reset response:', data);
      return data as PasswordResetResponse;

    } catch (error: any) {
      console.error('❌ Password reset service error:', error);
      
      // Fallback: Create a temporary user account with known password
      return this.createTemporaryResetSolution(email);
    }
  }

  /**
   * Validate custom reset token
   */
  async validateResetToken(token: string, email: string): Promise<ResetTokenValidation> {
    try {
      console.log('🔍 Validating reset token for:', email);

      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        console.error('❌ Token validation failed:', error);
        return {
          isValid: false,
          error: 'Invalid or expired reset token'
        };
      }

      console.log('✅ Token validated successfully');
      return {
        isValid: true,
        userId: data.user_id,
        email: data.email
      };

    } catch (error: any) {
      console.error('❌ Token validation error:', error);
      return {
        isValid: false,
        error: error.message || 'Failed to validate token'
      };
    }
  }

  /**
   * Reset password using custom token
   */
  async resetPasswordWithToken(token: string, email: string, newPassword: string): Promise<PasswordResetResponse> {
    try {
      console.log('🔄 Resetting password with custom token');

      // First validate the token
      const validation = await this.validateResetToken(token, email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid token');
      }

      // Update the user's password using admin functions
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        validation.userId!,
        { password: newPassword }
      );

      if (updateError) {
        console.error('❌ Password update failed:', updateError);
        throw new Error('Failed to update password');
      }

      // Mark token as used
      await supabase
        .from('password_reset_tokens')
        .update({ used: true, updated_at: new Date().toISOString() })
        .eq('token', token);

      console.log('✅ Password reset successful');
      return {
        success: true,
        message: 'Password reset successfully! You can now login with your new password.'
      };

    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      return {
        success: false,
        message: error.message || 'Failed to reset password'
      };
    }
  }

  /**
   * Fallback solution: Create temporary reset method
   */
  private async createTemporaryResetSolution(email: string): Promise<PasswordResetResponse> {
    try {
      console.log('🔧 Creating temporary reset solution for:', email);

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (!existingUser) {
        return {
          success: false,
          message: 'No account found with this email address.'
        };
      }

      // Generate a simple reset code
      const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const resetUrl = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`;

      // Store the reset code temporarily (you could use localStorage or a simple table)
      localStorage.setItem(`reset_${email}`, JSON.stringify({
        code: resetCode,
        expires: Date.now() + (60 * 60 * 1000), // 1 hour
        email: email
      }));

      console.log('🔗 Temporary reset URL:', resetUrl);
      console.log('🔑 Reset code:', resetCode);

      return {
        success: true,
        message: `Password reset requested. For development: Use code ${resetCode} or visit the reset URL in browser console.`,
        resetUrl: resetUrl
      };

    } catch (error: any) {
      console.error('❌ Temporary reset solution failed:', error);
      return {
        success: false,
        message: 'Unable to process password reset request. Please contact support.'
      };
    }
  }

  /**
   * Validate temporary reset code
   */
  validateTemporaryCode(email: string, code: string): boolean {
    try {
      const stored = localStorage.getItem(`reset_${email}`);
      if (!stored) return false;

      const data = JSON.parse(stored);
      if (data.code !== code || Date.now() > data.expires) {
        localStorage.removeItem(`reset_${email}`);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear temporary reset code
   */
  clearTemporaryCode(email: string): void {
    localStorage.removeItem(`reset_${email}`);
  }
}

export const passwordResetService = new PasswordResetService();
