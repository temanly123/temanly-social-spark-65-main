-- Create function for admin to get signed URLs for verification documents
CREATE OR REPLACE FUNCTION admin_get_document_url(document_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signed_url text;
  is_admin boolean := false;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Generate signed URL valid for 1 hour
  signed_url := extensions.create_signed_url(
    'verification-documents',
    document_path,
    3600 -- 1 hour expiry
  );
  
  RETURN signed_url;
END;
$$;

-- Grant execute permission to authenticated users (will be checked by function logic)
GRANT EXECUTE ON FUNCTION admin_get_document_url(text) TO authenticated;

-- Create view for admin to see all verification documents with user info
CREATE OR REPLACE VIEW admin_verification_documents AS
SELECT 
  vd.id,
  vd.user_id,
  vd.document_type,
  vd.document_url,
  vd.status,
  vd.file_name,
  vd.file_size,
  vd.content_type,
  vd.created_at,
  vd.updated_at,
  p.name as user_name,
  p.email as user_email,
  p.phone as user_phone,
  p.verification_status as user_verification_status
FROM verification_documents vd
LEFT JOIN profiles p ON vd.user_id = p.id
ORDER BY vd.created_at DESC;

-- Create RLS policy for the view (admin only)
CREATE POLICY "admin_only_verification_documents" ON verification_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Grant access to admin view
GRANT SELECT ON admin_verification_documents TO authenticated;

-- Create function to update document status (admin only)
CREATE OR REPLACE FUNCTION admin_update_document_status(
  document_id uuid,
  new_status text,
  admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  user_id_val uuid;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update document status
  UPDATE verification_documents 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = document_id
  RETURNING user_id INTO user_id_val;

  -- If all documents are approved, update user verification status
  IF new_status = 'approved' THEN
    -- Check if user has both required documents approved
    IF (
      SELECT COUNT(*) 
      FROM verification_documents 
      WHERE user_id = user_id_val 
      AND document_type IN ('id_card', 'profile_photo')
      AND status = 'approved'
    ) >= 2 THEN
      -- Update user verification status
      UPDATE profiles 
      SET 
        verification_status = 'verified',
        status = 'active',
        updated_at = now()
      WHERE id = user_id_val;
    END IF;
  END IF;

  -- If any document is rejected, set user verification to pending
  IF new_status = 'rejected' THEN
    UPDATE profiles 
    SET 
      verification_status = 'pending',
      updated_at = now()
    WHERE id = user_id_val;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_update_document_status(uuid, text, text) TO authenticated;