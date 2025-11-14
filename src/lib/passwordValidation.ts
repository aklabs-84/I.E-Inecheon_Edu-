import zxcvbn from 'zxcvbn';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  isBreached: boolean;
  breachCount?: number;
}

// 비밀번호 강도 검증 (zxcvbn 사용)
export const validatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  if (!password) {
    return { score: 0, feedback: ['비밀번호를 입력해주세요.'] };
  }

  const result = zxcvbn(password);
  const feedback: string[] = [];

  // 최소 요구사항 체크
  if (password.length < 8) {
    feedback.push('최소 8자 이상이어야 합니다.');
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('대문자를 포함해야 합니다.');
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('소문자를 포함해야 합니다.');
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('숫자를 포함해야 합니다.');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('특수문자를 포함해야 합니다.');
  }

  // zxcvbn 피드백 추가
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }
  
  result.feedback.suggestions.forEach(suggestion => {
    feedback.push(suggestion);
  });

  return {
    score: result.score,
    feedback
  };
};

// HIBP API를 사용한 누출 비밀번호 검증 (k-anonymity 방식)
export const checkPasswordBreach = async (password: string): Promise<{ isBreached: boolean; count?: number }> => {
  try {
    // SHA-1 해시 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // 첫 5자리만 HIBP API로 전송 (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true' // 보안 강화
      }
    });
    
    if (!response.ok) {
      console.warn('HIBP API 호출 실패, 누출 검사를 건너뜁니다.');
      return { isBreached: false };
    }
    
    const responseText = await response.text();
    const lines = responseText.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return { isBreached: true, count: parseInt(count, 10) };
      }
    }
    
    return { isBreached: false };
  } catch (error) {
    console.warn('비밀번호 누출 검사 중 오류 발생:', error);
    return { isBreached: false };
  }
};

// 종합 비밀번호 검증
export const validatePassword = async (password: string): Promise<PasswordValidationResult> => {
  const strengthResult = validatePasswordStrength(password);
  const breachResult = await checkPasswordBreach(password);
  
  const isValid = strengthResult.score >= 2 && strengthResult.feedback.length === 0 && !breachResult.isBreached;
  
  const feedback = [...strengthResult.feedback];
  if (breachResult.isBreached) {
    feedback.push(`이 비밀번호는 ${breachResult.count?.toLocaleString()}번 유출되었습니다. 다른 비밀번호를 사용해주세요.`);
  }
  
  return {
    isValid,
    score: strengthResult.score,
    feedback,
    isBreached: breachResult.isBreached,
    breachCount: breachResult.count
  };
};

// 비밀번호 강도 레벨 텍스트
export const getPasswordStrengthText = (score: number): { text: string; color: string } => {
  switch (score) {
    case 0:
      return { text: '매우 약함', color: 'text-red-500' };
    case 1:
      return { text: '약함', color: 'text-orange-500' };
    case 2:
      return { text: '보통', color: 'text-yellow-500' };
    case 3:
      return { text: '강함', color: 'text-blue-500' };
    case 4:
      return { text: '매우 강함', color: 'text-green-500' };
    default:
      return { text: '알 수 없음', color: 'text-gray-500' };
  }
};