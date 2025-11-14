import { toast } from "sonner";

// 블랙리스트 관련 알림 메시지들
export const BlacklistNotifications = {
  // 블랙리스트 추가 성공
  addSuccess: (userName: string, reason: string) => {
    toast.success("블랙리스트 처리 완료", {
      description: `${userName}님이 블랙리스트에 추가되었습니다.\n사유: ${reason}`,
      duration: 6000,
      action: {
        label: "자세히",
        onClick: () => console.log("블랙리스트 상세 정보")
      }
    });
  },

  // 블랙리스트 해제 성공
  removeSuccess: (userName: string) => {
    toast.success("블랙리스트 해제 완료", {
      description: `${userName}님이 블랙리스트에서 해제되었습니다.`,
      duration: 6000,
      action: {
        label: "확인",
        onClick: () => console.log("블랙리스트 해제 확인")
      }
    });
  },

  // 이메일 발송 성공
  emailSent: (email: string, type: 'blacklist' | 'removal') => {
    const message = type === 'blacklist' ? '블랙리스트 처리' : '블랙리스트 해제';
    toast.success("이메일 발송 완료", {
      description: `${email}로 ${message} 알림이 발송되었습니다.`,
      duration: 5000,
      icon: "📧"
    });
  },

  // 이메일 발송 실패
  emailFailed: (error: string) => {
    toast.error("이메일 발송 실패", {
      description: `알림 이메일 발송에 실패했습니다: ${error}`,
      duration: 8000,
      action: {
        label: "재시도",
        onClick: () => console.log("이메일 재발송")
      }
    });
  },

  // 출석 상태 변경
  attendanceUpdated: (userName: string, status: string, programTitle: string) => {
    const statusText = status === 'present' ? '출석' : 
                      status === 'absent' ? '결석' : 
                      status === 'late' ? '지각' : '상태 변경';
    
    toast.info("출석 상태 업데이트", {
      description: `${programTitle}\n${userName}님: ${statusText}`,
      duration: 4000,
    });
  },

  // 연속 결석 경고
  consecutiveAbsentWarning: (userName: string, absentCount: number) => {
    toast.warning("연속 결석 경고", {
      description: `${userName}님이 ${absentCount}회 연속 결석하였습니다.\n${3 - absentCount}회 더 결석 시 블랙리스트 처리됩니다.`,
      duration: 8000,
      action: {
        label: "관리",
        onClick: () => console.log("출석 관리")
      }
    });
  },

  // 자동 블랙리스트 처리 알림
  autoBlacklistTriggered: (userName: string, programTitle: string) => {
    toast.error("자동 블랙리스트 처리", {
      description: `${userName}님이 ${programTitle}에서 연속 3회 결석으로 자동 블랙리스트 처리되었습니다.`,
      duration: 10000,
      action: {
        label: "확인",
        onClick: () => console.log("자동 블랙리스트 확인")
      }
    });
  },

  // 권한 관련
  permissionDenied: (action: string) => {
    toast.error("권한 부족", {
      description: `${action} 권한이 없습니다. 관리자에게 문의하세요.`,
      duration: 5000,
    });
  },

  // 성공적인 작업 완료
  operationSuccess: (operation: string, details?: string) => {
    toast.success(`${operation} 완료`, {
      description: details || `${operation}이(가) 성공적으로 완료되었습니다.`,
      duration: 4000,
    });
  },

  // 일반 오류
  error: (message: string, details?: string) => {
    toast.error("오류 발생", {
      description: details || message,
      duration: 6000,
      action: {
        label: "다시 시도",
        onClick: () => window.location.reload()
      }
    });
  }
};

// 사용 예시:
// BlacklistNotifications.addSuccess("홍길동", "연속 3회 결석");
// BlacklistNotifications.emailSent("user@example.com", "blacklist");
// BlacklistNotifications.attendanceUpdated("홍길동", "absent", "프로그래밍 기초");