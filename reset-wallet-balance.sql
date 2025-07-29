-- 💰 RESET WALLET BALANCES TO ZERO
-- This removes the mock Rp 500,000 balance and sets all wallets to 0

-- Reset all wallet balances to 0
UPDATE public.profiles 
SET wallet_balance = 0 
WHERE wallet_balance > 0;

-- Delete all wallet transactions
DELETE FROM public.wallet_transactions WHERE 1=1;

-- Verify the reset
SELECT 
    email,
    name,
    wallet_balance,
    user_type
FROM public.profiles
WHERE wallet_balance > 0
ORDER BY wallet_balance DESC;

-- Show summary
SELECT 
    'Total users' as metric,
    COUNT(*) as value
FROM public.profiles
UNION ALL
SELECT 
    'Users with balance > 0',
    COUNT(*)
FROM public.profiles
WHERE wallet_balance > 0
UNION ALL
SELECT 
    'Total wallet transactions',
    COUNT(*)
FROM public.wallet_transactions;

SELECT '💰 All wallet balances reset to 0!' as status;
