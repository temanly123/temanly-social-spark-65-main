
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  type: 'user_signup' | 'talent_signup' | 'transaction_created' | 'payment_verified' | 'booking_created';
  user_id: string;
  description: string;
  metadata?: Record<string, any>;
  amount?: number;
  status: string;
}

export const logAdminActivity = async (activity: ActivityLog) => {
  try {
    console.log('Logging admin activity:', activity);
    
    // You could create an admin_logs table for detailed logging
    // For now, we'll just log to console and rely on real-time subscriptions
    
    // Optionally, you could also send notifications to admin
    // await supabase.functions.invoke('send-admin-notification', {
    //   body: { activity }
    // });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return { success: false, error };
  }
};

// Helper functions for specific activities
export const logUserSignup = async (userId: string, userName: string, userType: 'user' | 'companion') => {
  return logAdminActivity({
    type: userType === 'companion' ? 'talent_signup' : 'user_signup',
    user_id: userId,
    description: `New ${userType === 'companion' ? 'talent' : 'user'} registered: ${userName}`,
    status: 'pending',
    metadata: { user_type: userType }
  });
};

export const logTransactionCreated = async (userId: string, transactionId: string, service: string, amount: number) => {
  return logAdminActivity({
    type: 'transaction_created',
    user_id: userId,
    description: `New transaction created for ${service}`,
    amount,
    status: 'pending_verification',
    metadata: { transaction_id: transactionId, service }
  });
};

export const logPaymentVerified = async (userId: string, transactionId: string, amount: number, status: string) => {
  return logAdminActivity({
    type: 'payment_verified',
    user_id: userId,
    description: `Payment ${status} for transaction`,
    amount,
    status,
    metadata: { transaction_id: transactionId }
  });
};
