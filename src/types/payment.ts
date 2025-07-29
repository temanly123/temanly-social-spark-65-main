// Payment ecosystem types

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export type PayoutRequestStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';

export type PayoutTransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type PayoutMethod = 'bank_transfer' | 'e_wallet' | 'crypto';

export interface PaymentTransaction {
  id: string;
  booking_id?: string;
  user_id?: string;
  companion_id?: string;

  // User and Companion details
  user_name?: string;
  user_email?: string;
  companion_name?: string;
  companion_email?: string;
  companion_level?: string;

  // Payment details
  amount: number;
  service_name: string;
  service_type?: string;
  duration: number;

  // Midtrans integration
  midtrans_order_id?: string;
  midtrans_transaction_id?: string;
  midtrans_payment_type?: string;
  midtrans_gross_amount?: number;
  midtrans_transaction_status?: string;
  midtrans_fraud_status?: string;
  midtrans_settlement_time?: string;
  midtrans_raw_response?: any;

  // Financial breakdown
  platform_fee: number;
  companion_earnings: number;
  commission_rate: number;

  // Status tracking
  payment_status: PaymentStatus;
  payment_method: string;
  status?: string; // For compatibility

  // Timestamps
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

export interface PayoutRequest {
  id: string;
  companion_id: string;
  
  // Payout details
  requested_amount: number;
  available_earnings: number;
  payout_method: PayoutMethod;
  
  // Bank details
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  
  // Status and processing
  status: PayoutRequestStatus;
  admin_notes?: string;
  processed_by?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  processed_at?: string;
  
  // Relations
  companion?: {
    id: string;
    full_name: string;
    email: string;
  };
  processed_by_admin?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PayoutTransaction {
  id: string;
  payout_request_id: string;
  companion_id: string;
  
  // Transaction details
  amount: number;
  transaction_reference?: string;
  payout_method: PayoutMethod;
  
  // Bank details
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  
  // Status tracking
  status: PayoutTransactionStatus;
  failure_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Relations
  payout_request?: PayoutRequest;
  companion?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CompanionEarningsSummary {
  companion_id: string;
  companion_name?: string; // For display name
  companion_email?: string; // For email
  full_name?: string; // Alternative field name
  email?: string; // Alternative field name
  total_earnings: number;
  total_paid_out?: number;
  available_earnings?: number;
  available_balance?: number; // Alternative field name
  total_withdrawn?: number; // Alternative field name
  total_transactions: number;
  total_payout_requests?: number;
  last_payout_date?: string | null;
  talent_level?: string; // Fresh, Elite, VIP
}

export interface PaymentAnalytics {
  total_revenue: number;
  total_transactions: number;
  pending_payments: number;
  total_platform_fees: number;
  total_companion_earnings: number;
  total_commission_revenue?: number; // Commission fees from talent earnings
  total_platform_revenue?: number; // Platform fees + commission revenue
  pending_payouts: number;
  processed_payouts: number;
  today_revenue: number;
  today_transactions: number;
  monthly_revenue: number;
  monthly_transactions: number;
}

export interface MidtransPaymentData {
  order_id: string;
  gross_amount: number;
  customer_details: {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
  };
  item_details: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
}

export interface MidtransCallback {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
  settlement_time?: string;
  [key: string]: any;
}

export interface PayoutRequestForm {
  requested_amount: number;
  payout_method: PayoutMethod;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
}

export interface PayoutApprovalForm {
  status: 'approved' | 'rejected';
  admin_notes?: string;
}
