-- RPC function to get survey responses with admin check
CREATE OR REPLACE FUNCTION get_survey_responses_with_profiles(survey_id_param bigint)
RETURNS TABLE (
  id bigint,
  survey_id bigint,
  user_id uuid,
  responses jsonb,
  created_at timestamptz,
  name text,
  nickname text,
  region text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission to view survey responses
  IF NOT (
    -- User is admin or super admin
    is_admin() OR is_super_admin() OR
    -- User created the program that contains this survey
    EXISTS (
      SELECT 1 FROM surveys s
      JOIN programs p ON s.program_id = p.id
      WHERE s.id = survey_id_param AND p.created_by = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Access denied. You do not have permission to view these survey responses.';
  END IF;

  RETURN QUERY
  SELECT 
    sr.id,
    sr.survey_id,
    sr.user_id,
    sr.responses,
    sr.created_at,
    pr.name,
    pr.nickname,
    pr.region
  FROM survey_responses sr
  LEFT JOIN profiles pr ON sr.user_id = pr.id
  WHERE sr.survey_id = survey_id_param
  ORDER BY sr.created_at DESC;
END;
$$;