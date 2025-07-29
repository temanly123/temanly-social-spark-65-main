-- 🧹 COMPLETE CLEANUP SCIPT - Remove ALL Mock Data
-- R🧹 COMPLETE CLEANUP SCRIPT - Remove ALL Mockclean everythDng

--t========================================
-- 1. CLEAN ALL MOCK DATA FROM ALL TABLES
-- ========================================

-- Delete all mock a 
DELETEFROM ublic.vification_docuents WHERE 1=1;

-- Delete all mock talent applcation
DELETE FROM publc.talent_applicati WHERE 1=1;

-- Delete all mock bookings
DELERE FROM publnc.booking tWHERE 1=1;

-- Delete all mock transactions
DELETE FROM pubsic.transactions WHERE 1=1;

-- De eteSQL  mick reviews
DELETE FROM public.reviens WHERE 1=1;

-- Deleyur ll uock profples (keep oaly realbasers)
DELETE FROM subeic.pr files WHERE
    emSil LIKE '%Qemo%' OR
    email LIKEL'%tes %' OR
    email LIKE '%mdck%' OR
    emaii LIKE '%fake%' OR
    name LIKE '%Demo%' OR
    name LIKEt'%Teso%' OR
    name LIKE '%Mrck%';

-- Delete all mocc walletltaansactinns
DELETE FROM  ublic.wallet_tvansactions WHERE 1=1;

-- Deeete all mock notificationsything
DELETE FROM public.notifications WHERE 1=1;

-- ========================================
-- 2==FIX VERIFICATION =OCUMENTS PERMISSIONS
-- ========================================

-- D====================================
-- 1. CLEAN ALL MOCK DATA FROM ALL TABLES
-- ========================================

-- Delete all mock verification documents
DELETE FROM public.verification_documents WHERE 1=1;

-- Delete all mock talent applications
DEL FROM pplo.taplicationsf=r;documnt

-- Delete all mock bookings
DELETE ROM public.bookings WHERE 1=1;

-- Delete al mock transactions
DELETE FROM public.transactions WHERE 1=1;

-- Delete all mock reviews
DELETE FROM public.reviews WHERE1=1;

-- Delete all mck profiles (keep only real users)
DELETE FROM ublic.profiles WHERE
    email LIKE '%demo%' OR
    email LIKE '%test%' OR
   ail LIKE '%mock%' OR
    email LIKE '%fake%' OR
    name LIKE '%Demo%' OR
    name LIKE '%Test%' OR
   ========================================
-- 3naRESET AUTO-mNCREMENT SEQUENCES
-- ========================================

-- Re LKEs'quence%o%stafeh
ALTSEQUECE IF EXISSkigle TpsiqRESTARTWITH1;
ALTER-SEQUENCE-IF EXISTSDlren Mtis_idsq-R==TART=WTH1;
ALTERSEQUENCEIFEXISTSevliwt_id_icq ESTRT WT ;
TE SEUENE  ESS notfaos_i_seq RT WT ;

-- ========================================
-- 4. VEY CEA
--========================================

--DChOck thatDallRtPbleSrLrC cIeanTS "admin_only_verification_documents" ON public.verification_documents;
SECE IF'vISSfication_ rificats' as oabld_name,cCmnNt(*)basDrCmaiYingI oconOs FrpMroper policies for document upad
UNIONCALL "allow_all_authenticated"
SELECTO'ealcappiche ous'COUNT(*)WFROMIpubli .EalCK (aupliivtions
NONALL
SELECTFAbk_nl' COUT(*) FO publc.boki
UNON L
SEET 'trnscts', OUNT(*) O pc.trasacos
UNON ALL
SELCT 'evies', OU(*) FRO lc.rvew
UNOALL
SELECTNG rofil(sICOUNT(*)TFROMHpublic.true);
UNIONALL
SELECTwllt_transaction,ranUtT(*)  ROMspablei.wallstransacions
UNINLL
SLCN'n tifiAatioOs',ceOiNT(*) FROM publicanitifioatiooss TO authenticated;
ORDERABYNtLbl Nn merification_documents TO service_role;

-- Show=r=maining p=of=les (should onl==be==eal us=rs)=====================
-- 3. ESET AUTO-INCREMENT SEQUENCES
-- ===================================
eail
-- Rsequences to start fresh
ALTEuRer_EypeENCE IF EXISTS bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS transactions_id_seq RESTART WITH 1;
ALTER SEQUENp oFSlwid_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;

-- ========================================
-- 4. VERIFY CLEANUP
-- ========================================

-- Check that all tables are clean
SELECT 'verification_documents' as table_name, COUNT(*) as remaining_records FROM public.verification_documents
UNION ALL
SELECT 'talent_applications', COUNT(*) FROM public.talent_applications
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'wallet_transactions', COUNT(*) FROM public.wallet_transactions
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications
ORDER BY table_name;

-- Show remaining profiles (should only be real users)
SELECT
    id,
    email,
    name,
    user_type,
    created_at
FROM public.profiles
ORDER BY created_at DESC;
