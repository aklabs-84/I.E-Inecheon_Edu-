-- 기존 profiles 테이블의 role 제약 조건 확인 및 수정
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 새로운 역할 제약 조건 추가 (user, admin, super_admin 허용)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- aklabs84@naver.com 유저를 슈퍼 관리자로 지정
UPDATE public.profiles 
SET role = 'super_admin', updated_at = now()
WHERE email = 'aklabs84@naver.com';

-- 관리자 요청 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- 슈퍼관리자 확인 함수
CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid()) AND role = 'super_admin'
  );
$$;

-- RLS 정책들
CREATE POLICY "admin_requests_insert_own"
ON public.admin_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_requests_select_own"
ON public.admin_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "admin_requests_select_super_admin"
ON public.admin_requests
FOR SELECT
USING (is_super_admin());

CREATE POLICY "admin_requests_update_super_admin"
ON public.admin_requests
FOR UPDATE
USING (is_super_admin());

-- 요청 생성 함수
CREATE OR REPLACE FUNCTION public.request_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
  ) THEN
    RAISE EXCEPTION 'Already have admin privileges';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_requests WHERE user_id = auth.uid() AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Admin request already pending';
  END IF;

  INSERT INTO public.admin_requests (user_id) VALUES (auth.uid());
END;
$$;

-- 요청 검토 함수
CREATE OR REPLACE FUNCTION public.review_admin_request(
  request_id uuid,
  approve boolean,
  review_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_user_id uuid;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can review requests';
  END IF;

  SELECT user_id INTO req_user_id
  FROM public.admin_requests
  WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  UPDATE public.admin_requests
  SET 
    status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    reason = review_reason,
    updated_at = now()
  WHERE id = request_id;

  IF approve THEN
    UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = req_user_id;
  END IF;
END;
$$;

-- updated_at 트리거 추가
CREATE TRIGGER update_admin_requests_updated_at
BEFORE UPDATE ON public.admin_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();