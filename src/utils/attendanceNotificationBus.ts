type AttendanceNotificationData = {
  userId: string;
  programTitle: string;
  status: 'present' | 'absent' | 'late';
  date: string;
};

class AttendanceNotificationBus {
  private listeners: ((data: AttendanceNotificationData) => void)[] = [];

  subscribe(callback: (data: AttendanceNotificationData) => void) {
    this.listeners.push(callback);
    
    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  publish(data: AttendanceNotificationData) {
    console.log('🚀 출석 알림 이벤트 발행:', data);
    console.log('📡 현재 구독자 수:', this.listeners.length);
    this.listeners.forEach((listener, index) => {
      console.log(`📢 구독자 ${index + 1}에게 알림 전송 중...`);
      listener(data);
    });
  }
}

export const attendanceNotificationBus = new AttendanceNotificationBus();
export type { AttendanceNotificationData };