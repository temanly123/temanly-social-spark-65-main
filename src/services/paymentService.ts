import { supabase } from '@/integrations/supabase/client';
import { TalentLevelService } from './talentLevelService';
import type { CompanionEarningsSummary } from '@/types/payment';

export interface PaymentTransaction {
  id: string;
  amount: number;
  service_name: string;
  service_type: string;
  duration: number;
  platform_fee: number;
  companion_earnings: number;
  commission_rate: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  companion_id: string;
  companion_name?: string;
  companion_email?: string;
  companion_level?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  midtrans_order_id?: string;
  midtrans_transaction_id?: string;
  midtrans_payment_type?: string;
  midtrans_transaction_status?: string;
  midtrans_fraud_status?: string;
  midtrans_raw_response?: any;
  notes?: string;
}

export interface PayoutRequest {
  id: string;
  companion_id: string;
  companion_name?: string;
  requested_amount: number;
  available_earnings: number;
  payout_method: string;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  companion?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PayoutRequestForm {
  requested_amount: number;
  payout_method: string;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
}

export interface PayoutTransaction {
  id: string;
  payout_request_id: string;
  companion_id: string;
  amount: number;
  transaction_type: 'payout';
  status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface CompanionEarnings {
  companion_id: string;
  full_name: string;
  email: string;
  total_earnings: number;
  total_paid_out: number;
  available_earnings: number;
  pending_payouts: number;
  last_payout_date?: string;
}

export interface PaymentAnalytics {
  total_revenue: number;
  total_transactions: number;
  pending_payments: number;
  total_platform_fees: number;
  total_commission_revenue: number;
  total_platform_revenue: number;
  total_companion_earnings: number;
  average_transaction_value: number;
  monthly_revenue: number;
  monthly_transactions: number;
}

export interface PaymentBreakdown {
  serviceAmount: number;      // Base service price
  appFee: number;            // 10% app fee charged to customer
  totalChargedToCustomer: number; // serviceAmount + appFee
  commissionRate: number;    // Based on talent level (20%, 18%, 15%)
  commissionAmount: number;  // Commission taken from service amount
  talentEarnings: number;    // Service amount minus commission
  platformRevenue: number;   // App fee + commission
}

export class PaymentService {

  /**
   * Calculate payment breakdown based on Temanly business model:
   * - Customer pays: Service Amount + 10% App Fee
   * - Platform keeps: 10% App Fee + Commission (based on talent level)
   * - Talent receives: Service Amount - Commission
   */
  static calculatePaymentBreakdown(
    serviceAmount: number,
    talentLevel: 'fresh' | 'elite' | 'vip' = 'fresh'
  ): PaymentBreakdown {
    // App fee: 10% of service amount, charged to customer
    const appFee = Math.round(serviceAmount * 0.10);
    const totalChargedToCustomer = serviceAmount + appFee;

    // Commission rates based on talent level
    const commissionRates = {
      fresh: 0.20, // 20%
      elite: 0.18, // 18%
      vip: 0.15    // 15%
    };

    const commissionRate = commissionRates[talentLevel];
    const commissionAmount = Math.round(serviceAmount * commissionRate);
    const talentEarnings = serviceAmount - commissionAmount;
    const platformRevenue = appFee + commissionAmount;

    return {
      serviceAmount,
      appFee,
      totalChargedToCustomer,
      commissionRate: commissionRate * 100, // Convert to percentage
      commissionAmount,
      talentEarnings,
      platformRevenue
    };
  }
  // Payment Transactions
  static async createPaymentTransaction(data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment transaction:', error);
      throw error;
    }
    return transaction;
  }

  static async getPaymentTransactions(filters?: {
    companion_id?: string;
    user_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaymentTransaction[]> {
    try {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          companions:companion_id (
            full_name,
            email,
            talent_level
          ),
          users:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.companion_id) {
        query = query.eq('companion_id', filters.companion_id);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.status) {
        query = query.eq('payment_status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching payment transactions:', error);
        throw error;
      }

      // Transform data to include companion and user details
      const transformedData = data?.map(transaction => ({
        ...transaction,
        companion_name: transaction.companions?.full_name,
        companion_email: transaction.companions?.email,
        companion_level: transaction.companions?.talent_level,
        user_name: transaction.users?.full_name,
        user_email: transaction.users?.email
      })) || [];

      return transformedData as PaymentTransaction[];
    } catch (error) {
      console.error('Error in getPaymentTransactions:', error);
      throw error;
    }
  }

  static async updatePaymentTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment transaction:', error);
      throw error;
    }
    return data;
  }

  static async getPaymentTransactionByMidtransOrderId(orderId: string): Promise<PaymentTransaction | null> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('midtrans_order_id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Payout Requests
  static async createPayoutRequest(data: PayoutRequestForm & { companion_id: string }): Promise<PayoutRequest> {
    try {
      // Get available earnings first
      const earnings = await this.getCompanionEarnings(data.companion_id);

      const requestData = {
        ...data,
        available_earnings: earnings.available_earnings
      };

      const { data: request, error } = await supabase
        .from('payout_requests')
        .insert([requestData])
        .select(`
          *,
          companion:profiles!companion_id(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error('Error creating payout request:', error);
        throw error;
      }
      return request;
    } catch (error) {
      console.error('Error in createPayoutRequest:', error);
      throw error;
    }
  }

  static async getPayoutRequests(filters?: {
    companion_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PayoutRequest[]> {
    try {
      let query = supabase
        .from('payout_requests')
        .select(`
          *,
          companion:profiles!companion_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.companion_id) {
        query = query.eq('companion_id', filters.companion_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching payout requests:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error in getPayoutRequests:', error);
      throw error;
    }
  }

  static async updatePayoutRequest(id: string, updateData: Partial<PayoutRequest>): Promise<PayoutRequest> {
    try {
      const { data: request, error } = await supabase
        .from('payout_requests')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          companion:profiles!companion_id(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error('Error updating payout request:', error);
        throw error;
      }
      return request;
    } catch (error) {
      console.error('Error in updatePayoutRequest:', error);
      throw error;
    }
  }

  // Payout Processing
  static async processPayoutRequest(id: string, updates: { status: string; processed_by: string; admin_notes?: string }): Promise<PayoutRequest> {
    try {
      const updatedRequest = await this.updatePayoutRequest(id, {
        ...updates,
        processed_at: new Date().toISOString()
      });

      // If approved, create payout transaction
      if (updates.status === 'approved') {
        await this.createPayoutFinancialRecord(updatedRequest);
      }

      return updatedRequest;
    } catch (error) {
      console.error('Error processing payout request:', error);
      throw error;
    }
  }

  static async createPayoutTransaction(payoutRequest: PayoutRequest): Promise<PayoutTransaction> {
    try {
      const transactionData = {
        payout_request_id: payoutRequest.id,
        companion_id: payoutRequest.companion_id,
        amount: payoutRequest.requested_amount,
        transaction_type: 'payout' as const,
        status: 'completed',
        payment_method: payoutRequest.payout_method
      };

      const { data: transaction, error } = await supabase
        .from('payout_transactions')
        .insert([{
          ...transactionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating payout transaction:', error);
        throw error;
      }
      return transaction;
    } catch (error) {
      console.error('Error in createPayoutTransaction:', error);
      throw error;
    }
  }

  static async createPayoutFinancialRecord(payoutRequest: PayoutRequest): Promise<void> {
    try {
      const financialRecord = {
        id: `payout-${payoutRequest.id}`,
        midtrans_order_id: `PAYOUT-${Date.now()}`,
        amount: -payoutRequest.requested_amount, // Negative for payout
        service_name: 'Payout',
        service_type: 'payout',
        duration: 0,
        platform_fee: 0,
        companion_earnings: -payoutRequest.requested_amount,
        commission_rate: 0,
        payment_status: 'paid',
        payment_method: payoutRequest.payout_method,
        companion_id: payoutRequest.companion_id,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('payment_transactions')
        .insert([financialRecord]);

      if (error) {
        console.error('Error creating payout financial record:', error);
        throw error;
      }

      console.log('Created financial record for payout:', financialRecord);
    } catch (error) {
      console.error('Error in createPayoutFinancialRecord:', error);
      throw error;
    }
  }

  // Companion Earnings
  static async getCompanionEarnings(companionId: string): Promise<CompanionEarnings> {
    try {
      // Get companion profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', companionId)
        .single();

      // Get total earnings from payment transactions
      const { data: earnings } = await supabase
        .from('payment_transactions')
        .select('companion_earnings')
        .eq('companion_id', companionId)
        .eq('payment_status', 'paid');

      // Get total paid out from payout requests
      const { data: payouts } = await supabase
        .from('payout_requests')
        .select('requested_amount')
        .eq('companion_id', companionId)
        .eq('status', 'approved');

      // Get pending payouts
      const { data: pendingPayouts } = await supabase
        .from('payout_requests')
        .select('requested_amount')
        .eq('companion_id', companionId)
        .eq('status', 'pending');

      const totalEarnings = earnings?.reduce((sum, t) => sum + (t.companion_earnings || 0), 0) || 0;
      const totalPaidOut = payouts?.reduce((sum, p) => sum + (p.requested_amount || 0), 0) || 0;
      const pendingAmount = pendingPayouts?.reduce((sum, p) => sum + (p.requested_amount || 0), 0) || 0;

      return {
        companion_id: companionId,
        full_name: profile?.full_name || 'Unknown',
        email: profile?.email || 'unknown@temanly.com',
        total_earnings: totalEarnings,
        total_paid_out: totalPaidOut,
        available_earnings: totalEarnings - totalPaidOut - pendingAmount,
        pending_payouts: pendingAmount,
        last_payout_date: payouts?.[0]?.created_at
      };
    } catch (error) {
      console.error('Error in getCompanionEarnings:', error);
      throw error;
    }
  }

  // Get all companion earnings summary
  static async getAllCompanionEarnings(): Promise<CompanionEarningsSummary[]> {
    try {
      // Get all companions who have received payments
      const { data: companionIds } = await supabase
        .from('payment_transactions')
        .select('companion_id')
        .eq('payment_status', 'paid')
        .not('companion_id', 'is', null);

      if (!companionIds || companionIds.length === 0) {
        return [];
      }

      // Get unique companion IDs
      const uniqueCompanionIds = [...new Set(companionIds.map(t => t.companion_id))];

      // Get detailed earnings for each companion
      const earningsPromises = uniqueCompanionIds.map(async (companionId) => {
        try {
          const earnings = await this.getCompanionEarnings(companionId);

          // Get additional stats
          const { data: transactions } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('companion_id', companionId)
            .eq('payment_status', 'paid');

          const { data: profile } = await supabase
            .from('profiles')
            .select('talent_level')
            .eq('id', companionId)
            .single();

          const { data: payoutRequests } = await supabase
            .from('payout_requests')
            .select('*')
            .eq('companion_id', companionId)
            .order('created_at', { ascending: false });

          return {
            companion_id: companionId,
            companion_name: earnings.full_name,
            companion_email: earnings.email,
            full_name: earnings.full_name,
            email: earnings.email,
            total_earnings: earnings.total_earnings,
            total_paid_out: earnings.total_paid_out,
            available_earnings: earnings.available_earnings,
            available_balance: earnings.available_earnings,
            total_withdrawn: earnings.total_paid_out,
            total_transactions: transactions?.length || 0,
            total_payout_requests: payoutRequests?.length || 0,
            last_payout_date: payoutRequests?.[0]?.created_at || null,
            talent_level: profile?.talent_level || 'Fresh'
          } as CompanionEarningsSummary;
        } catch (error) {
          console.error(`Error getting earnings for companion ${companionId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(earningsPromises);
      return results.filter(result => result !== null) as CompanionEarningsSummary[];
    } catch (error) {
      console.error('Error in getAllCompanionEarnings:', error);
      throw error;
    }
  }

  // Analytics
  static async getPaymentAnalytics(): Promise<PaymentAnalytics> {
    try {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_status', 'paid');

      if (error) {
        console.error('Error fetching payment analytics:', error);
        throw error;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyTransactions = transactions?.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      }) || [];

      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalPlatformFees = transactions?.reduce((sum, t) => sum + (t.platform_fee || 0), 0) || 0;
      const totalCompanionEarnings = transactions?.reduce((sum, t) => sum + (t.companion_earnings || 0), 0) || 0;

      // Calculate commission revenue: For each transaction, commission = service_amount * commission_rate
      // Service amount = total_amount - platform_fee
      const totalCommissionRevenue = transactions?.reduce((sum, t) => {
        if (t.commission_amount) {
          // If commission_amount is stored directly
          return sum + (t.commission_amount || 0);
        } else {
          // Calculate from service amount and commission rate
          const serviceAmount = (t.amount || 0) - (t.platform_fee || 0);
          const commissionRate = (t.commission_rate || 0) / 100; // Convert percentage to decimal
          const commission = Math.round(serviceAmount * commissionRate);
          return sum + commission;
        }
      }, 0) || 0;

      const totalPlatformRevenue = totalPlatformFees + totalCommissionRevenue;
      const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        total_revenue: totalRevenue,
        total_transactions: transactions?.length || 0,
        pending_payments: 0, // Would need separate query for pending
        total_platform_fees: totalPlatformFees,
        total_commission_revenue: totalCommissionRevenue,
        total_platform_revenue: totalPlatformRevenue,
        total_companion_earnings: totalCompanionEarnings,
        average_transaction_value: transactions?.length ? totalRevenue / transactions.length : 0,
        monthly_revenue: monthlyRevenue,
        monthly_transactions: monthlyTransactions.length
      };
    } catch (error) {
      console.error('Error in getPaymentAnalytics:', error);
      throw error;
    }
  }

  // Midtrans Integration
  static generateMidtransPaymentData(
    orderId: string,
    amount: number,
    customerDetails: any,
    itemDetails: any[]
  ): any {
    return {
      order_id: orderId,
      gross_amount: amount,
      customer_details: customerDetails,
      item_details: itemDetails,
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      }
    };
  }

  static async handleMidtransCallback(callbackData: any): Promise<PaymentTransaction | null> {
    const transaction = await this.getPaymentTransactionByMidtransOrderId(callbackData.order_id);

    if (!transaction) {
      console.warn('Transaction not found for Midtrans callback:', callbackData.order_id);
      return null;
    }

    const updates: Partial<PaymentTransaction> = {
      midtrans_transaction_id: callbackData.transaction_id,
      midtrans_payment_type: callbackData.payment_type,
      midtrans_transaction_status: callbackData.transaction_status,
      midtrans_fraud_status: callbackData.fraud_status,
      midtrans_raw_response: callbackData,
      updated_at: new Date().toISOString()
    };

    // Update payment status based on Midtrans status
    if (callbackData.transaction_status === 'settlement' || callbackData.transaction_status === 'capture') {
      updates.payment_status = 'paid';
      updates.paid_at = new Date().toISOString();
    } else if (callbackData.transaction_status === 'pending') {
      updates.payment_status = 'pending';
    } else if (callbackData.transaction_status === 'deny' || callbackData.transaction_status === 'cancel' || callbackData.transaction_status === 'expire') {
      updates.payment_status = 'failed';
    }

    return await this.updatePaymentTransaction(transaction.id, updates);
  }
}
