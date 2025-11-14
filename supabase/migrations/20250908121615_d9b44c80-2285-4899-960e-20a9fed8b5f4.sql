-- 1) Create a SECURITY DEFINER helper to avoid recursive RLS checks
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid())
      AND role = 'admin'
  );
$$;

-- Ensure all roles can execute the function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

-- 2) Fix profiles SELECT policies (remove self-referencing EXISTS)
DROP POLICY IF EXISTS "profiles_select_for_admin_check" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin_all"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- 3) Update programs policies to use the helper
DROP POLICY IF EXISTS "programs_admin_write" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_update" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_delete" ON public.programs;

CREATE POLICY "programs_admin_write"
ON public.programs
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "programs_admin_update"
ON public.programs
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "programs_admin_delete"
ON public.programs
FOR DELETE
USING (public.is_admin());
