-- Create function to revoke admin privileges
CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can revoke admin roles';
  END IF;

  -- Update user role back to 'user'
  UPDATE public.profiles 
  SET role = 'user', updated_at = now() 
  WHERE id = target_user_id AND role = 'admin';

  -- Update any approved admin request to revoked status
  UPDATE public.admin_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    reason = '슈퍼관리자에 의해 승인 취소됨',
    updated_at = now()
  WHERE user_id = target_user_id AND status = 'approved';
END;
$$;