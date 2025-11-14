-- 게시글 카테고리 enum 생성
CREATE TYPE post_category AS ENUM ('맛집', '행사', '생활', '고민', '일반');

-- 신청 상태 enum 생성  
CREATE TYPE app_status AS ENUM ('pending', 'approved', 'cancelled');

-- 사용자 프로필 테이블 생성
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 교육 프로그램 테이블 생성
CREATE TABLE public.programs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  region TEXT,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  capacity INTEGER,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 프로그램 신청 테이블 생성
CREATE TABLE public.applications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id BIGINT NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status app_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- 커뮤니티 게시글 테이블 생성
CREATE TABLE public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category post_category NOT NULL,
  region TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_hidden BOOLEAN DEFAULT false
);

-- 댓글 테이블 생성
CREATE TABLE public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_hidden BOOLEAN DEFAULT false
);

-- 배너 테이블 생성
CREATE TABLE public.banners (
  id BIGSERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  href TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX programs_search_idx ON public.programs 
  USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));
CREATE INDEX programs_region_idx ON public.programs(region);
CREATE INDEX programs_category_idx ON public.programs(category);

CREATE INDEX posts_search_idx ON public.posts 
  USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));
CREATE INDEX posts_category_idx ON public.posts(category);
CREATE INDEX posts_region_idx ON public.posts(region);

-- Row Level Security 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성

-- 프로필 정책: 본인 또는 관리자만 조회/수정
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 프로그램 정책: 모든 사용자 조회 가능, 관리자만 생성/수정/삭제
CREATE POLICY "programs_select_all" ON public.programs
  FOR SELECT USING (true);

CREATE POLICY "programs_admin_write" ON public.programs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "programs_admin_update" ON public.programs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "programs_admin_delete" ON public.programs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 신청 정책: 본인 신청만 조회/생성/수정, 관리자는 모든 신청 관리 가능
CREATE POLICY "applications_select_own_or_admin" ON public.applications
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "applications_insert_own" ON public.applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "applications_update_own_or_admin" ON public.applications
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "applications_delete_own_or_admin" ON public.applications
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 게시글 정책: 숨겨지지 않은 글은 모든 사용자 조회, 본인 글만 생성/수정/삭제
CREATE POLICY "posts_select_public_or_admin" ON public.posts
  FOR SELECT USING (
    is_hidden = false OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own_or_admin" ON public.posts
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "posts_delete_own_or_admin" ON public.posts
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 댓글 정책: 숨겨지지 않은 댓글은 모든 사용자 조회, 본인 댓글만 생성/수정/삭제
CREATE POLICY "comments_select_public_or_admin" ON public.comments
  FOR SELECT USING (
    is_hidden = false OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_update_own_or_admin" ON public.comments
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "comments_delete_own_or_admin" ON public.comments
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 배너 정책: 활성화된 배너만 조회, 관리자만 관리
CREATE POLICY "banners_select_active" ON public.banners
  FOR SELECT USING (active = true);

CREATE POLICY "banners_admin_write" ON public.banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 자동 업데이트 타임스탬프 함수 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 신규 사용자 등록 시 프로필 자동 생성 트리거
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();