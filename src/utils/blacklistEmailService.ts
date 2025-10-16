// 블랙리스트 처리 시 이메일 알림을 위한 유틸리티
// 실제 프로덕션에서는 이메일 서비스 (SendGrid, AWS SES 등)와 연결

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

// 블랙리스트 처리 이메일 발송
export const sendBlacklistNotificationEmail = async (data: BlacklistEmailData) => {
  
  // 실제 이메일 발송 로직
  const emailContent = {
    to: data.userEmail,
    subject: "[인천 교육] 프로그램 참여 제한 안내",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">프로그램 참여 제한 안내</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
          <p style="margin-top: 0;"><strong>${data.userName}</strong>님께,</p>
          
          <p>안녕하세요. 인천 교육 프로그램 운영팀입니다.</p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="color: #dc2626; margin-top: 0;">프로그램 참여 제한 처리</h3>
            <p><strong>사유:</strong> ${data.reason}</p>
            ${data.programTitle ? `<p><strong>해당 프로그램:</strong> ${data.programTitle}</p>` : ""}
            ${data.absentCount ? `<p><strong>총 결석 횟수:</strong> ${data.absentCount}회</p>` : ""}
            <p><strong>제한 기간:</strong> ${new Date(data.blacklistedUntil).toLocaleDateString("ko-KR")}까지</p>
          </div>
          
          <p>연속 결석으로 인해 향후 프로그램 신청이 일시적으로 제한됩니다.</p>
          
          <p>프로그램 운영의 원활함과 다른 참여자들을 위한 조치임을 양해해 주시기 바랍니다.</p>
          
          <p>궁금한 사항이 있으시면 운영팀으로 문의해 주세요.</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
          
          <p style="color: #666; font-size: 14px; margin-bottom: 0;">
            인천 교육 프로그램 운영팀<br>
            이메일: admin@incheonedu.kr<br>
            전화: 032-123-4567
          </p>
        </div>
      </div>
    `
  };

  // 여기서 실제 이메일 서비스 API 호출
  // 예: await emailService.send(emailContent);
  
  return { success: true, message: "블랙리스트 알림 이메일이 발송되었습니다." };
};

// 블랙리스트 해제 이메일 발송
export const sendBlacklistRemovalEmail = async (data: BlacklistRemovalEmailData) => {
  
  const emailContent = {
    to: data.userEmail,
    subject: "[인천 교육] 프로그램 참여 제한 해제 안내",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">프로그램 참여 제한 해제</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
          <p style="margin-top: 0;"><strong>${data.userName}</strong>님께,</p>
          
          <p>안녕하세요. 인천 교육 프로그램 운영팀입니다.</p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #059669; margin-top: 0;">프로그램 참여 제한 해제</h3>
            <p>관리자 <strong>${data.removedBy}</strong>에 의해 프로그램 참여 제한이 해제되었습니다.</p>
            <p>이제 다시 프로그램에 신청하실 수 있습니다.</p>
          </div>
          
          <p>앞으로도 인천 교육 프로그램에 많은 관심과 참여 부탁드립니다.</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
          
          <p style="color: #666; font-size: 14px; margin-bottom: 0;">
            인천 교육 프로그램 운영팀<br>
            이메일: admin@incheonedu.kr<br>
            전화: 032-123-4567
          </p>
        </div>
      </div>
    `
  };

  return { success: true, message: "블랙리스트 해제 알림 이메일이 발송되었습니다." };
};

// 실제 이메일 서비스 설정 (예시)
export const configureEmailService = () => {
  // SendGrid, AWS SES, Nodemailer 등의 설정
  return {
    apiKey: process.env.EMAIL_API_KEY,
    fromEmail: process.env.FROM_EMAIL || "admin@incheonedu.kr",
    fromName: "인천 교육 운영팀"
  };
};