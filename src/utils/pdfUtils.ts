import jsPDF from "jspdf";

/**
 * jsPDF에 한글 폰트 임베드 (안전한 fallback 포함)
 */
export async function loadKoreanFont(doc: jsPDF): Promise<boolean> {
  try {
    // 한글 폰트 로딩 시도
    const response = await fetch("/fonts/korean-font-base64.js");
    if (!response.ok) {
      throw new Error("Korean font file not found");
    }
    
    const fontData = await response.text();
    const base64Font = fontData.replace(/^[^,]*,/, ""); // data:font/truetype;base64, 제거
    
    // Base64 유효성 검증
    if (!base64Font || base64Font.length < 100) {
      throw new Error("Invalid font data");
    }
    
    doc.addFileToVFS("NotoSansKR-Regular.ttf", base64Font);
    doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
    doc.setFont("NotoSansKR", "normal");
    return true;
  } catch (error) {
    console.warn("Korean font loading failed, using helvetica fallback:", error);
    // 안전한 폴백: 기본 폰트 사용
    doc.setFont("helvetica", "normal");
    return false;
  }
}

/**
 * 웹폰트 로딩 대기 및 한글 폰트 처리
 */
export async function ensureFontsLoaded(): Promise<void> {
  try {
    // 웹폰트 로딩 대기
    if (document?.fonts?.ready) {
      await document.fonts.ready;
    }
    
    // Google Fonts 로딩 확인
    const link = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (!link) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400&display=swap';
      document.head.appendChild(fontLink);
      
      // 폰트 로딩 대기 (최대 3초)
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 3000);
        fontLink.onload = () => {
          clearTimeout(timeout);
          resolve(void 0);
        };
      });
    }
  } catch (error) {
    console.warn("Font loading check failed:", error);
  }
}

/**
 * jsPDF에서 한글 텍스트 처리 (이미지 기반)
 * 한글 폰트 임베딩 대신 HTML을 이미지로 변환하는 방식 사용
 */
export async function createTextAsImage(text: string, fontSize: number = 12): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    // 캔버스 크기 설정
    ctx.font = `${fontSize}px 'Noto Sans KR', sans-serif`;
    const metrics = ctx.measureText(text);
    const width = Math.ceil(metrics.width) + 20;
    const height = fontSize + 10;
    
    canvas.width = width;
    canvas.height = height;
    
    // 배경 설정
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // 텍스트 스타일 재설정 (캔버스 크기 변경 후)
    ctx.font = `${fontSize}px 'Noto Sans KR', sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'middle';
    
    // 텍스트 렌더링
    ctx.fillText(text, 10, height / 2);
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Text to image conversion failed:', error);
    return '';
  }
}

/**
 * 텍스트가 PDF 페이지 너비를 초과할 경우 줄바꿈 처리
 */
export function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  try {
    const lines = doc.splitTextToSize(text, maxWidth);
    let currentY = y;
    
    lines.forEach((line: string) => {
      doc.text(line, x, currentY);
      currentY += 7; // 줄 간격
    });
    
    return currentY; // 다음 텍스트 시작 위치 반환
  } catch (error) {
    console.error('Text wrapping failed:', error);
    doc.text(text, x, y); // 실패 시 원본 텍스트 그대로
    return y + 10;
  }
}

/**
 * 파일명에서 특수문자 제거 및 안전한 파일명 생성
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9가-힣\s-_]/g, '_') // 특수문자를 언더스코어로 대체
    .replace(/\s+/g, '_') // 공백을 언더스코어로 대체
    .replace(/_+/g, '_') // 연속된 언더스코어를 하나로 합치기
    .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
    .substring(0, 200); // 파일명 길이 제한
}

/**
 * Canvas 크기 제한 확인 및 조정
 */
export function validateCanvasSize(width: number, height: number): { width: number; height: number; scale: number } {
  const MAX_CANVAS_SIZE = 32767; // 대부분 브라우저의 canvas 크기 제한
  let scale = 1;
  
  if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
    scale = Math.min(MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height);
    console.warn(`Canvas size too large, scaling down by ${scale}`);
  }
  
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
    scale
  };
}

/**
 * 메모리 사용량 확인 (가능한 경우)
 */
export function checkMemoryUsage(): boolean {
  try {
    // @ts-ignore - performance.memory는 Chrome에서만 사용 가능
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const memoryUsageRatio = usedJSHeapSize / totalJSHeapSize;
      
      if (memoryUsageRatio > 0.9) {
        console.warn('High memory usage detected, PDF generation might fail');
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn('Memory check failed:', error);
    return true; // 체크 실패 시 계속 진행
  }
}

/**
 * PDF 생성 전 사전 검증
 */
export function validatePDFGeneration(element: HTMLElement): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 요소 존재 확인
  if (!element) {
    errors.push('PDF 변환할 요소가 존재하지 않습니다.');
  }
  
  // 요소 크기 확인
  if (element && (element.offsetWidth === 0 || element.offsetHeight === 0)) {
    errors.push('PDF 변환할 요소의 크기가 0입니다.');
  }
  
  // 메모리 확인
  if (!checkMemoryUsage()) {
    errors.push('메모리 사용량이 높아 PDF 생성이 실패할 수 있습니다.');
  }
  
  // 캔버스 크기 확인
  if (element) {
    const { width, height } = element.getBoundingClientRect();
    const validation = validateCanvasSize(width * 2, height * 2); // html2canvas scale 고려
    if (validation.scale < 1) {
      errors.push(`요소가 너무 커서 품질이 저하될 수 있습니다. (축소 비율: ${validation.scale.toFixed(2)})`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 에러 복구를 위한 재시도 함수
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 지수 백오프
      }
    }
  }
  
  throw lastError;
}