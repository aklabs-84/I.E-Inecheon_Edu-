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

    // 임시 테스트: 확인된 이메일로 발송
    const testEmail = 'digicon84@gmail.com';
    console.log(`🔄 테스트를 위해 ${userEmail} 대신 ${testEmail}로 발송합니다.`);

    // incheonedu.kr 도메인 연결 완료로 실제 사용자 이메일로 발송
    const { data, error } = await supabase.functions.invoke('send-blacklist-email', {
      body: {
        userEmail: testEmail, // 테스트용 이메일로 임시 변경
        userName,
        reason,
        blacklistedUntil,
        type: 'blacklist'
      },
    });

    if (error) {
      console.error('❌ 블랙리스트 이메일 발송 실패 (Supabase 에러):', error);
      console.error('❌ 에러 세부 정보:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ 블랙리스트 이메일 발송 성공:', data);
    console.log(`📧 ${userEmail}로 블랙리스트 통지 이메일이 발송되었습니다.`);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ 블랙리스트 이메일 발송 실패:', error);
    console.error('❌ 에러 타입:', typeof error);
    console.error('❌ 에러 메시지:', error?.message || '알 수 없는 에러');
    return { success: false, error: error?.message || error };
  }
};

// 블랙리스트 해제 시 이메일 발송
export const sendBlacklistRemovalEmail = async (userEmail: string, userName: string) => {
  try {
    console.log('📧 블랙리스트 해제 이메일 발송 시작:', {
      to: userEmail,
      userName
    });

    // incheonedu.kr 도메인 연결 완료로 실제 사용자 이메일로 발송
    const { data, error } = await supabase.functions.invoke('send-blacklist-email', {
      body: {
        userEmail: userEmail, // 실제 사용자 이메일로 발송
        userName,
        reason: '',
        blacklistedUntil: '',
        type: 'remove'
      },
    });

    if (error) {
      console.error('❌ 블랙리스트 해제 이메일 발송 실패 (Supabase 에러):', error);
      console.error('❌ 에러 세부 정보:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ 블랙리스트 해제 이메일 발송 성공:', data);
    console.log(`📧 ${userEmail}로 블랙리스트 해제 통지 이메일이 발송되었습니다.`);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ 블랙리스트 해제 이메일 발송 실패:', error);
    console.error('❌ 에러 타입:', typeof error);
    console.error('❌ 에러 메시지:', error?.message || '알 수 없는 에러');
    return { success: false, error: error?.message || error };
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