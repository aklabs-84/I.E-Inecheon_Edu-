import { supabase } from '@/integrations/supabase/client';

// 블랙리스트 등록 시 이메일 발송
export const sendBlacklistEmail = async (userEmail: string, userName: string, reason: string, blacklistedUntil: string) => {
  try {
    console.log('📧 블랙리스트 이메일 발송 시작:', {
      to: userEmail,
      userName,
      reason,
      blacklistedUntil
    });

    // Resend 무료 계정 제한으로 테스트용 이메일 주소 사용
    const testEmail = 'digicon84@gmail.com'; // Resend 계정 소유자 이메일

    const { data, error } = await supabase.functions.invoke('send-blacklist-email', {
      body: {
        userEmail: testEmail, // 테스트용으로 변경
        userName,
        reason,
        blacklistedUntil,
        type: 'blacklist'
      },
    });

    if (error) {
      console.error('❌ 블랙리스트 이메일 발송 실패 (Supabase 에러):', error);
      throw error;
    }

    console.log('✅ 블랙리스트 이메일 발송 성공:', data);
    console.log(`📧 실제로는 ${userEmail}로 발송될 예정이지만, 테스트를 위해 ${testEmail}로 발송되었습니다.`);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ 블랙리스트 이메일 발송 실패:', error);
    return { success: false, error: error.message };
  }
};

// 블랙리스트 해제 시 이메일 발송
export const sendBlacklistRemovalEmail = async (userEmail: string, userName: string) => {
  try {
    console.log('📧 블랙리스트 해제 이메일 발송 시작:', {
      to: userEmail,
      userName
    });

    // Resend 무료 계정 제한으로 테스트용 이메일 주소 사용
    const testEmail = 'digicon84@gmail.com'; // Resend 계정 소유자 이메일

    const { data, error } = await supabase.functions.invoke('send-blacklist-email', {
      body: {
        userEmail: testEmail, // 테스트용으로 변경
        userName,
        reason: '',
        blacklistedUntil: '',
        type: 'remove'
      },
    });

    if (error) {
      console.error('❌ 블랙리스트 해제 이메일 발송 실패 (Supabase 에러):', error);
      throw error;
    }

    console.log('✅ 블랙리스트 해제 이메일 발송 성공:', data);
    console.log(`📧 실제로는 ${userEmail}로 발송될 예정이지만, 테스트를 위해 ${testEmail}로 발송되었습니다.`);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ 블랙리스트 해제 이메일 발송 실패:', error);
    return { success: false, error: error.message };
  }
};

// 기존 호환성을 위한 인터페이스들
export interface BlacklistEmailData {
  userEmail: string;
  userName: string;
  programTitle?: string;
  reason: string;
  blacklistedUntil: string;
  absentCount?: number;
}

export interface BlacklistRemovalEmailData {
  userEmail: string;
  userName: string;
  removedBy: string;
}

// 기존 함수들 (호환성 유지)
export const sendBlacklistNotificationEmail = async (data: BlacklistEmailData) => {
  return await sendBlacklistEmail(data.userEmail, data.userName, data.reason, data.blacklistedUntil);
};

export const sendBlacklistRemovalNotificationEmail = async (data: BlacklistRemovalEmailData) => {
  return await sendBlacklistRemovalEmail(data.userEmail, data.userName);
};