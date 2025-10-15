-- Fix is_admin function to include super_admin role
-- super_admin should have admin privileges

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid())
      AND role IN ('admin', 'super_admin')
  );
$$;

-- Ensure all roles can execute the function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;