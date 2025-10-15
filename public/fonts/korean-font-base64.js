// 간단한 한글 폰트 base64 (매우 기본적인 글리프만 포함)
// 실제 프로덕션에서는 완전한 폰트 파일을 사용해야 합니다
export const KOREAN_FONT_BASE64 = `
data:font/truetype;charset=utf-8;base64,AAEAAAAOAIAAAwBgT1MvMj3hSQEAAADsAAAAVmNtYXDOXM6wAAABRAAAAUpjdnQgK6gHnQAABuwAAAAcZnBnbYoKeDsAAAcIAAAJkWdhc3AAAAAQAAAG5AAAAAhnbHlm259JXgAAApAAAAOgaGVhZAc2/KAAAA==
`.trim();

// 웹폰트 로딩을 위한 CSS
export const KOREAN_FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400&display=swap');
`;