-- 1) 지정 유저를 슈퍼관리자로 지정
UPDATE public.profiles 
SET role = 'super_admin', updated_at = now()
WHERE email = 'aklabs84@naver.com';

-- 2) 관리자 요청 테이블 생성 (profiles 참조)
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

-- 3) RLS 활성화
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- 4) 슈퍼관리자 확인 함수
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

-- 5) RLS 정책
DO $$ BEGIN
  -- 개인 요청 작성
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_requests' AND policyname='admin_requests_insert_own'
  ) THEN
    CREATE POLICY admin_requests_insert_own
    ON public.admin_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;

  -- 본인 요청 조회
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_requests' AND policyname='admin_requests_select_own'
  ) THEN
    CREATE POLICY admin_requests_select_own
    ON public.admin_requests
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;

  -- 슈퍼관리자 모두 조회
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_requests' AND policyname='admin_requests_select_super_admin'
  ) THEN
    CREATE POLICY admin_requests_select_super_admin
    ON public.admin_requests
    FOR SELECT
    USING (is_super_admin());
  END IF;

  -- 슈퍼관리자 업데이트
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_requests' AND policyname='admin_requests_update_super_admin'
  ) THEN
    CREATE POLICY admin_requests_update_super_admin
    ON public.admin_requests
    FOR UPDATE
    USING (is_super_admin());
  END IF;
END $$;

-- 6) 요청 생성 함수
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

  -- 이미 관리자 이상이면 불가
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')
  ) THEN
    RAISE EXCEPTION 'Already have admin privileges';
  END IF;

  -- 대기 중 요청 중복 방지
  IF EXISTS (
    SELECT 1 FROM public.admin_requests WHERE user_id = auth.uid() AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Admin request already pending';
  END IF;

  INSERT INTO public.admin_requests (user_id) VALUES (auth.uid());
END;
$$;

-- 7) 요청 검토 함수 (승인/거절)
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
  -- 슈퍼관리자만 가능
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can review requests';
  END IF;

  -- 대상 조회 (대기 상태만)
  SELECT user_id INTO req_user_id
  FROM public.admin_requests
  WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- 상태 업데이트
  UPDATE public.admin_requests
  SET 
    status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    reason = review_reason,
    updated_at = now()
  WHERE id = request_id;

  -- 승인 시 역할 변경
  IF approve THEN
    UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = req_user_id;
  END IF;
END;
$$;

-- 8) updated_at 트리거
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname = 'update_admin_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_admin_requests_updated_at
    BEFORE UPDATE ON public.admin_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
