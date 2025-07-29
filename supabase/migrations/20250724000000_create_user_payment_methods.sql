-- Create user payment methods table
-- This table stores user's saved payment methods for easier checkout

CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment method details
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'bank_account', 'e_wallet')),
  name TEXT NOT NULL, -- e.g., "Visa ending in 4242", "BCA Account", "GoPay"
  details TEXT NOT NULL, -- e.g., "**** **** **** 4242", "Account: 1234567890", "+62 812-3456-7890"
  
  -- Additional metadata
  is_default BOOLEAN DEFAULT FALSE,
  last_used TIMESTAMPTZ,
  
  -- For credit cards
  card_brand TEXT, -- visa, mastercard, etc.
  card_last_four TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  -- For bank accounts
  bank_name TEXT,
  account_number_masked TEXT,
  
  -- For e-wallets
  wallet_provider TEXT, -- gopay, ovo, dana, etc.
  wallet_phone TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_card_exp_month CHECK (card_exp_month IS NULL OR (card_exp_month >= 1 AND card_exp_month <= 12)),
  CONSTRAINT valid_card_exp_year CHECK (card_exp_year IS NULL OR card_exp_year >= EXTRACT(YEAR FROM NOW()))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_is_default ON user_payment_methods(user_id, is_default);

-- Enable RLS
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payment methods" ON user_payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON user_payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON user_payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON user_payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all payment methods
CREATE POLICY "Admins can view all payment methods" ON user_payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this method as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE user_payment_methods 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_user_payment_methods_updated_at();
