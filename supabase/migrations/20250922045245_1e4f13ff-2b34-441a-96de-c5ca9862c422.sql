-- Create enum types for attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');

-- Create attendance table for tracking student attendance
CREATE TABLE public.attendance (
  id bigserial PRIMARY KEY,
  program_id bigint NOT NULL,
  user_id uuid NOT NULL,
  attendance_date date NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id, attendance_date)
);

-- Create surveys table for managing program surveys
CREATE TABLE public.surveys (
  id bigserial PRIMARY KEY,
  program_id bigint NOT NULL,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create survey responses table
CREATE TABLE public.survey_responses (
  id bigserial PRIMARY KEY,
  survey_id bigint NOT NULL,
  user_id uuid NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- Create consent forms table
CREATE TABLE public.consent_forms (
  id bigserial PRIMARY KEY,
  program_id bigint NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create consent submissions table
CREATE TABLE public.consent_submissions (
  id bigserial PRIMARY KEY,
  consent_form_id bigint NOT NULL,
  user_id uuid NOT NULL,
  agreed boolean NOT NULL DEFAULT false,
  signature text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(consent_form_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attendance
CREATE POLICY "attendance_select_admin" ON public.attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = attendance.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "attendance_insert_admin" ON public.attendance FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = attendance.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "attendance_update_admin" ON public.attendance FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = attendance.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "attendance_delete_admin" ON public.attendance FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = attendance.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

-- Create RLS policies for surveys
CREATE POLICY "surveys_select_admin_or_participant" ON public.surveys FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = surveys.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  ) OR
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.program_id = surveys.program_id AND a.user_id = auth.uid() AND a.status = 'approved'
  )
);

CREATE POLICY "surveys_insert_admin" ON public.surveys FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = surveys.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  ) AND created_by = auth.uid()
);

CREATE POLICY "surveys_update_admin" ON public.surveys FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = surveys.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "surveys_delete_admin" ON public.surveys FOR DELETE USING (
  created_by = auth.uid() OR is_super_admin()
);

-- Create RLS policies for survey responses
CREATE POLICY "survey_responses_select_admin_or_own" ON public.survey_responses FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.surveys s
    JOIN public.programs p ON s.program_id = p.id
    WHERE s.id = survey_responses.survey_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "survey_responses_insert_own" ON public.survey_responses FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.surveys s
    JOIN public.applications a ON s.program_id = a.program_id
    WHERE s.id = survey_responses.survey_id 
    AND a.user_id = auth.uid() 
    AND a.status = 'approved'
    AND s.is_active = true
  )
);

CREATE POLICY "survey_responses_update_own" ON public.survey_responses FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for consent forms
CREATE POLICY "consent_forms_select_admin_or_participant" ON public.consent_forms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = consent_forms.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  ) OR
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.program_id = consent_forms.program_id AND a.user_id = auth.uid() AND a.status = 'approved'
  )
);

CREATE POLICY "consent_forms_insert_admin" ON public.consent_forms FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = consent_forms.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  ) AND created_by = auth.uid()
);

CREATE POLICY "consent_forms_update_admin" ON public.consent_forms FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = consent_forms.program_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "consent_forms_delete_admin" ON public.consent_forms FOR DELETE USING (
  created_by = auth.uid() OR is_super_admin()
);

-- Create RLS policies for consent submissions
CREATE POLICY "consent_submissions_select_admin_or_own" ON public.consent_submissions FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.consent_forms cf
    JOIN public.programs p ON cf.program_id = p.id
    WHERE cf.id = consent_submissions.consent_form_id 
    AND (p.created_by = auth.uid() OR is_admin() OR is_super_admin())
  )
);

CREATE POLICY "consent_submissions_insert_own" ON public.consent_submissions FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.consent_forms cf
    JOIN public.applications a ON cf.program_id = a.program_id
    WHERE cf.id = consent_submissions.consent_form_id 
    AND a.user_id = auth.uid() 
    AND a.status = 'approved'
    AND cf.is_active = true
  )
);

CREATE POLICY "consent_submissions_update_own" ON public.consent_submissions FOR UPDATE USING (user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_forms_updated_at
  BEFORE UPDATE ON public.consent_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();