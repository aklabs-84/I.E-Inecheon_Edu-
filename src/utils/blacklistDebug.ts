// 블랙리스트 시스템 디버깅을 위한 유틸리티

export const debugBlacklist = {
  // 블랙리스트 상태 확인
  checkStatus: (userId: string, blacklistData: any) => {
    console.group("🔍 블랙리스트 상태 체크");
    console.log("사용자 ID:", userId);
    console.log("블랙리스트 데이터:", blacklistData);
    
    if (blacklistData) {
      console.log("활성 상태:", blacklistData.is_active);
      console.log("제한 기간:", blacklistData.blacklisted_until);
      console.log("현재 시간:", new Date().toISOString());
      console.log("제한 여부:", new Date(blacklistData.blacklisted_until) > new Date());
    } else {
      console.log("❌ 블랙리스트 데이터 없음");
    }
    console.groupEnd();
  },

  // 신청 차단 로그
  blockApplication: (reason: string) => {
    console.warn("🚫 프로그램 신청 차단:", reason);
  },

  // 이메일 발송 시뮬레이션
  simulateEmail: (emailData: any) => {
    console.group("📧 이메일 발송 시뮬레이션");
    console.log("수신자:", emailData.userEmail);
    console.log("이름:", emailData.userName);
    console.log("제목:", "[인천 교육] 프로그램 참여 제한 안내");
    console.log("내용:", `${emailData.reason} - ${emailData.blacklistedUntil}까지 제한`);
    console.groupEnd();
  }
};

// 전역에서 사용할 수 있도록 window 객체에 추가 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugBlacklist = debugBlacklist;
}