-- Create payment ecosystem tables
-- This migration creates a comprehensive payment system with payout management

-- Create payment_transactions table (enhanced version of transactions)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  companion_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  service_name TEXT NOT NULL,
  service_type service_type,
  duration INTEGER NOT NULL DEFAULT 1,
  
  -- Midtrans integration
  midtrans_order_id TEXT UNIQUE,
  midtrans_transaction_id TEXT,
  midtrans_payment_type TEXT,
  midtrans_gross_amount DECIMAL(12,2),
  midtrans_transaction_status TEXT,
  midtrans_fraud_status TEXT,
  midtrans_settlement_time TIMESTAMPTZ,
  midtrans_raw_response JSONB,
  
  -- Financial breakdown
  platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  companion_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  
  -- Status tracking
  payment_status payment_status DEFAULT 'pending',
  payment_method TEXT DEFAULT 'midtrans',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_earnings CHECK (companion_earnings >= 0),
  CONSTRAINT positive_platform_fee CHECK (platform_fee >= 0)
);

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Payout details
  requested_amount DECIMAL(12,2) NOT NULL,
  available_earnings DECIMAL(12,2) NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
  
  -- Bank details
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  
  -- Status and processing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_requested_amount CHECK (requested_amount > 0),
  CONSTRAINT positive_available_earnings CHECK (available_earnings >= 0),
  CONSTRAINT valid_request CHECK (requested_amount <= available_earnings)
);

-- Create payout_transactions table (actual payouts)
CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id UUID NOT NULL REFERENCES payout_requests(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount DECIMAL(12,2) NOT NULL,
  transaction_reference TEXT UNIQUE,
  payout_method TEXT NOT NULL,
  
  -- Bank details (copied from request)
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_payout_amount CHECK (amount > 0)
);

-- Create companion_earnings_summary view
CREATE OR REPLACE VIEW companion_earnings_summary AS
SELECT 
  p.id as companion_id,
  p.full_name,
  p.email,
  COALESCE(SUM(pt.companion_earnings), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN pr.status = 'processed' THEN pr.requested_amount ELSE 0 END), 0) as total_paid_out,
  COALESCE(SUM(pt.companion_earnings), 0) - COALESCE(SUM(CASE WHEN pr.status = 'processed' THEN pr.requested_amount ELSE 0 END), 0) as available_earnings,
  COUNT(pt.id) as total_transactions,
  COUNT(pr.id) as total_payout_requests
FROM profiles p
LEFT JOIN payment_transactions pt ON p.id = pt.companion_id AND pt.payment_status = 'paid'
LEFT JOIN payout_requests pr ON p.id = pr.companion_id
WHERE p.user_type = 'companion'
GROUP BY p.id, p.full_name, p.email;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_companion_id ON payment_transactions(companion_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_midtrans_order_id ON payment_transactions(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payout_requests_companion_id ON payout_requests(companion_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_payout_transactions_companion_id ON payout_transactions(companion_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout_request_id ON payout_transactions(payout_request_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_status ON payout_transactions(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_transactions_updated_at BEFORE UPDATE ON payout_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = companion_id);

CREATE POLICY "Admins can view all payment transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "System can insert payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payment transactions" ON payment_transactions
  FOR UPDATE USING (true);

-- RLS Policies for payout_requests
CREATE POLICY "Companions can view their own payout requests" ON payout_requests
  FOR SELECT USING (auth.uid() = companion_id);

CREATE POLICY "Companions can create their own payout requests" ON payout_requests
  FOR INSERT WITH CHECK (auth.uid() = companion_id);

CREATE POLICY "Companions can update their pending payout requests" ON payout_requests
  FOR UPDATE USING (auth.uid() = companion_id AND status = 'pending');

CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update payout requests" ON payout_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- RLS Policies for payout_transactions
CREATE POLICY "Companions can view their own payout transactions" ON payout_transactions
  FOR SELECT USING (auth.uid() = companion_id);

CREATE POLICY "Admins can view all payout transactions" ON payout_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage payout transactions" ON payout_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
