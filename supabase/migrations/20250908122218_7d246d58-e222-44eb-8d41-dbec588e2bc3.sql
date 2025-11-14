-- Create helper to elevate current user to admin (development convenience)
CREATE OR REPLACE FUNCTION public.elevate_to_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (id, role, created_at, updated_at)
  VALUES (auth.uid(), 'admin', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.elevate_to_admin() TO authenticated;