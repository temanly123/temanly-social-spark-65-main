-- Check current RLS status and create admin access policies for verification_documents

-- Ensure RLS is enabled on verification_documents table
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Admin can access all verification documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can view own verification documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can manage own verification documents" ON public.verification_documents;

-- Create policy for admin access to all verification documents
CREATE POLICY "Admin can access all verification documents"
ON public.verification_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Create policy for users to manage their own documents
CREATE POLICY "Users can manage own verification documents"
ON public.verification_documents
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy for service role (for edge functions)
CREATE POLICY "Service role can access all verification documents"
ON public.verification_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);