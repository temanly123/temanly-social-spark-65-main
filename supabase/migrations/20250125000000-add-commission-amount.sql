-- Add commission_amount column to payment_transactions table
-- This stores the actual commission amount in rupiah for easier calculations

-- Add the commission_amount column
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2) DEFAULT 0;

-- Update existing records to calculate commission_amount from commission_rate
-- commission_amount = (amount - platform_fee) * commission_rate / 100
UPDATE public.payment_transactions 
SET commission_amount = ROUND(((amount - platform_fee) * commission_rate / 100), 0)
WHERE commission_amount = 0 OR commission_amount IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.payment_transactions.commission_amount IS 'Commission amount in rupiah taken from service amount based on talent level';

-- Create index for better performance on commission calculations
CREATE INDEX IF NOT EXISTS idx_payment_transactions_commission_amount ON public.payment_transactions(commission_amount);

-- Update the trigger to automatically calculate commission_amount when inserting/updating
CREATE OR REPLACE FUNCTION calculate_commission_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate commission amount from service amount and commission rate
    -- Service amount = total amount - platform fee
    -- Commission amount = service amount * commission rate / 100
    IF NEW.commission_rate IS NOT NULL AND NEW.amount IS NOT NULL AND NEW.platform_fee IS NOT NULL THEN
        NEW.commission_amount = ROUND(((NEW.amount - NEW.platform_fee) * NEW.commission_rate / 100), 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate commission_amount
DROP TRIGGER IF EXISTS trigger_calculate_commission_amount ON public.payment_transactions;
CREATE TRIGGER trigger_calculate_commission_amount
    BEFORE INSERT OR UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_commission_amount();

-- Verify the changes
DO $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'commission_amount'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ commission_amount column added successfully to payment_transactions table';
    ELSE
        RAISE NOTICE '❌ Failed to add commission_amount column';
    END IF;
END $$;
