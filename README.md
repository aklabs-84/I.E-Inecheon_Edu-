# IncheonEdu

인천교육 프로젝트(IncheonEdu)는 지역 교육 프로그램의 신청·관리, 커뮤니티 소통, 설문/동의서 수집 및 결과 조회를 하나의 웹 애플리케이션에서 처리할 수 있도록 돕는 SPA(Single-Page Application)입니다.

## 핵심 기능
- 프로그램 목록/상세 조회 및 신청(신청자 관리 포함)
- 출석 관리(통계/테이블 보기)
- 커뮤니티(게시글, 댓글, 좋아요)
- 설문 폼 생성/응답 수집/결과 조회 및 엑셀 내보내기
- 보호자 동의서(전자 서명 포함) 수집/관리 및 결과 집계, PDF/엑셀 내보내기
- 관리자/슈퍼관리자 화면(프로그램/설문/동의서 관리)
- 사용자 온보딩 및 프로필 관리

## 기술 스택
- 프런트엔드: React + TypeScript + Vite
- UI: Tailwind CSS, shadcn-ui 컴포넌트
- 인증/백엔드: Supabase (Auth, Database, Storage)
- 상태/데이터: Supabase 클라이언트 및 커스텀 훅 기반 데이터 패칭

## 디렉터리 구조(요약)
```
public/           # 정적 자원 (파비콘, 폰트, robots.txt 등)
src/
	components/     # UI 및 도메인 컴포넌트 (테이블, 카드, 폼, 모달 등)
	hooks/          # 커스텀 훅 (useAuth, usePrograms, useSurveys 등)
	pages/          # 라우트 페이지 (Home, Programs, Admin, Survey 등)
	integrations/
		supabase/     # Supabase 클라이언트 및 타입
	lib/            # 유틸리티/검증 로직 (예: 비밀번호 규칙)
	utils/          # 엑셀/PDF 내보내기 등 헬퍼
	main.tsx        # 앱 엔트리포인트
supabase/
	migrations/     # DB 스키마/함수/정책 마이그레이션 SQL
```

## 주요 페이지/컴포넌트
- `src/pages/Programs.tsx`: 프로그램 목록
- `src/pages/ProgramDetail.tsx`: 프로그램 상세/신청
- `src/pages/ProgramManagement.tsx`, `src/pages/AdminPrograms.tsx`: 프로그램 관리
- `src/pages/Survey.tsx`, `src/pages/SurveyManagement.tsx`, `src/components/SurveyForm.tsx`, `src/components/SurveyResults.tsx`: 설문 생성/응답/결과
- `src/pages/ConsentPage.tsx`, `src/components/ConsentForm.tsx`, `src/components/ConsentResults.tsx`, `src/components/SignatureModal.tsx`: 보호자 동의서 수집/서명/결과
- `src/pages/Community.tsx`, `src/components/PostForm.tsx`, `src/components/CommentSection.tsx`, `src/components/CommunityCard.tsx`: 커뮤니티(게시글/댓글/좋아요)
- `src/components/AttendanceTable.tsx`, `src/components/AttendanceStats.tsx`: 출석 관리 및 통계
- `src/pages/Auth.tsx`, `src/hooks/useAuth.ts`: 로그인/회원가입/이메일 인증 처리
- `src/pages/Onboarding.tsx`, `src/pages/MyProfile.tsx`: 온보딩/프로필

## 인증 및 보안
- Supabase Auth를 사용하며, 이메일 인증(매직 링크) 흐름을 지원합니다.
- 리다이렉트 URL은 두 가지 형태를 모두 처리합니다:
	- `?code=...` (PKCE 기반 쿼리 파라미터)
	- `#access_token=...` (URL 프래그먼트)
- 프로덕션/개발 도메인을 Supabase 프로젝트의 Site URL/Redirect URLs에 등록해야 인증 링크가 정상 동작합니다.
- 환경변수(Vite): 클라이언트 키는 `.env`에만 두고, 절대 저장소에 커밋하지 않습니다.
	- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (또는 `VITE_SUPABASE_ANON_KEY`)
- 만약 키가 외부에 노출되었을 가능성이 있다면 Supabase 콘솔에서 즉시 키를 회전(rotate)하고 배포 환경변수를 업데이트하세요.

## 로컬 실행
1) 의존성 설치
```bash
npm install
```
2) 루트에 `.env` 파일 생성 (예)
```env
VITE_SUPABASE_URL="https://<your-project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-publishable-or-anon-key>"
```
3) 개발 서버 실행
```bash
npm run dev
```

## 배포(권장: Vercel)
1) GitHub 저장소에 푸시( `.env`는 커밋 금지 )
2) Vercel에서 GitHub 저장소 연동 후 환경변수 설정
	 - `VITE_SUPABASE_URL`
	 - `VITE_SUPABASE_PUBLISHABLE_KEY`
3) 배포 완료 후 Supabase의 Site URL/Redirect URLs를 배포 도메인으로 업데이트
4) 이메일 인증 링크 테스트(도메인/리다이렉트 일치 확인)

## 데이터/엑셀/PDF 내보내기
- `src/utils/consentExcelExport.ts`, `src/utils/surveyExcelExport.ts`, `src/utils/excelExport.ts`: 결과를 엑셀로 내보내는 헬퍼
- `src/utils/pdfUtils.ts`: PDF 내보내기 유틸리티

## 라이선스
- 사내/교육용으로 사용하는 경우, 별도의 라이선스 지정 없이 private 저장소로 운영 가능합니다.
- 공개 전환 시에는 필요에 따라 MIT/Apache-2.0 등의 라이선스 추가를 고려하세요.
