# Vercel 환경 변수 설정 가이드

## 🔧 Vercel Dashboard에서 설정해야 할 환경 변수들

### 1. Supabase 설정
```
VITE_SUPABASE_PROJECT_ID=nfneaoditsqzdhzcrnwc
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_qmupTLcCp-3OoL40Q4pTSQ_yuSsnEFz
VITE_SUPABASE_URL=https://nfneaoditsqzdhzcrnwc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbmVhb2RpdHNxemRoemNybndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDIwMDYsImV4cCI6MjA3MjYxODAwNn0.9oIQqn4b4GfNqGGVPSBbEpfKyal_HI9IEcMJvaF6ctc
```

## 🚀 배포 단계

### 방법 1: Vercel 웹사이트에서 배포 (권장)

1. **Vercel Dashboard 접속**: https://vercel.com/dashboard
2. **"New Project" 클릭**
3. **GitHub 저장소 선택**: `aklabs-84/I.E-Inecheon_Edu-`
4. **프로젝트 설정**:
   - Project Name: `incheon-edu`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **환경 변수 설정**:
   - 위의 환경 변수들을 모두 추가

6. **Deploy 클릭**

### 방법 2: Git 연결 후 자동 배포

1. **변경사항 커밋 후 푸시**
2. **Vercel이 자동으로 감지하여 배포**

## 📝 배포 후 확인사항

- [ ] 웹사이트가 정상적으로 로드되는지 확인
- [ ] Supabase 연결이 정상적으로 작동하는지 확인
- [ ] 로그인/회원가입 기능 테스트
- [ ] 블랙리스트 기능 테스트
- [ ] 이메일 발송 기능 테스트

## 🔧 문제 해결

### 빌드 실패 시
1. **로그 확인**: Vercel Dashboard → Functions → Logs
2. **의존성 문제**: package.json 재검토
3. **환경 변수**: 모든 환경 변수가 올바르게 설정되었는지 확인

### 실행 오류 시
1. **브라우저 콘솔 확인**
2. **Supabase 연결 상태 확인**
3. **API 호출 오류 확인**