-- Fix consent_submissions RLS policies to prevent data leaks
-- Replace the overly broad policy with more restrictive ones

-- Drop the problematic policy that may allow cross-user data access
DROP POLICY IF EXISTS "consent_submissions_select_admin_or_own" ON public.consent_submissions;

-- Create strict policy: Users can ONLY see their own submissions
CREATE POLICY "consent_submissions_select_own_data" 
ON public.consent_submissions 
FOR SELECT 
USING (user_id = auth.uid());

-- Create separate policy: Program creators can see submissions for their programs
CREATE POLICY "consent_submissions_select_program_admin" 
ON public.consent_submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM consent_forms cf 
    JOIN programs p ON cf.program_id = p.id 
    WHERE cf.id = consent_submissions.consent_form_id 
      AND p.created_by = auth.uid()
  )
);

-- Create policy: System admins can see all submissions
CREATE POLICY "consent_submissions_select_system_admin" 
ON public.consent_submissions 
FOR SELECT 
USING (is_admin() OR is_super_admin());