-- 기존 profiles 테이블의 role 타입 확장
ALTER TYPE public.text DROP CONSTRAINT IF EXISTS check_role;

-- profiles 테이블에 super_admin 역할 추가 (기본 text 타입 사용)
-- aklabs84@naver.com 유저를 슈퍼 관리자로 지정
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'aklabs84@naver.com';

-- 관리자 요청 테이블 생성
CREATE TABLE public.admin_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- 슈퍼 관리자 확인 함수 생성
CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = COALESCE(uid, auth.uid())
      AND role = 'super_admin'
  );
$function$;

-- 관리자 요청 RLS 정책
CREATE POLICY "Users can insert their own admin requests" 
ON public.admin_requests 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own requests" 
ON public.admin_requests 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all requests" 
ON public.admin_requests 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admins can update all requests" 
ON public.admin_requests 
FOR UPDATE 
USING (is_super_admin());

-- 관리자 요청 함수 생성
CREATE OR REPLACE FUNCTION public.request_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 이미 관리자이면 오류
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Already have admin privileges';
  END IF;

  -- 이미 요청했으면 오류
  IF EXISTS (SELECT 1 FROM public.admin_requests WHERE user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'Admin request already pending';
  END IF;

  -- 새 요청 생성
  INSERT INTO public.admin_requests (user_id)
  VALUES (auth.uid());
END;
$function$;

-- 관리자 승인/거절 함수
CREATE OR REPLACE FUNCTION public.review_admin_request(
  request_id uuid,
  approve boolean,
  review_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  req_user_id uuid;
BEGIN
  -- 슈퍼 관리자인지 확인
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can review requests';
  END IF;

  -- 요청 정보 가져오기
  SELECT user_id INTO req_user_id
  FROM public.admin_requests
  WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- 요청 상태 업데이트
  UPDATE public.admin_requests
  SET 
    status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    reason = review_reason,
    updated_at = now()
  WHERE id = request_id;

  -- 승인시 유저 역할 업데이트
  IF approve THEN
    UPDATE public.profiles
    SET role = 'admin', updated_at = now()
    WHERE id = req_user_id;
  END IF;
END;
$function$;

-- 업데이트 트리거 추가
CREATE TRIGGER update_admin_requests_updated_at
BEFORE UPDATE ON public.admin_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();