// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail, userName, reason, blacklistedUntil, type } = await req.json()

    // 입력 데이터 검증
    if (!userEmail || !userName || !type) {
      throw new Error('필수 데이터가 누락되었습니다: userEmail, userName, type')
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable not found')
    }

    console.log('Sending email to:', userEmail, 'Type:', type)

    const emailData = {
      from: 'onboarding@resend.dev', // 임시로 기본 발신자로 변경
      to: [userEmail],
      subject: type === 'blacklist' ? '인천에듀 - 프로그램 신청 제한 안내' : '인천에듀 - 프로그램 신청 제한 해제 안내',
      html: generateEmailTemplate(userName, reason, blacklistedUntil, type)
    }

    console.log('Email data prepared:', JSON.stringify({ ...emailData, html: '[HTML_CONTENT]' }))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    console.log('Resend API response status:', res.status)

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Resend API failed with status ${res.status}: ${errorText}`)
    }

    const result = await res.json()
    console.log('Email sent successfully:', result)
    
    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function generateEmailTemplate(userName: string, reason: string, blacklistedUntil: string, type: 'blacklist' | 'remove') {
  if (type === 'blacklist') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px; 
            border-radius: 12px; 
            text-align: center; 
            margin-bottom: 30px;
          }
          .content { 
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .warning { 
            background: #fef2f2; 
            border-left: 4px solid #ef4444;
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            padding-top: 30px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px;
          }
          .date {
            background: #f3f4f6;
            padding: 10px 15px;
            border-radius: 6px;
            display: inline-block;
            font-weight: bold;
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎓 인천 Connect Hub</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">프로그램 신청 제한 안내</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">안녕하세요, <strong>${userName}</strong>님</p>
            
            <div class="warning">
              <h3 style="color: #dc2626; margin-top: 0; font-size: 18px;">⚠️ 프로그램 신청이 제한되었습니다</h3>
              <p style="margin: 15px 0;"><strong>제한 사유:</strong> ${reason}</p>
              <p style="margin: 15px 0;"><strong>제한 해제일:</strong> <span class="date">${new Date(blacklistedUntil).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span></p>
            </div>
            
            <p style="margin: 20px 0;">연속된 결석으로 인해 향후 프로그램 신청이 일시적으로 제한됩니다.</p>
            
            <p style="margin: 20px 0;">제한 기간이 종료된 후 다시 프로그램에 참여하실 수 있습니다. 문의사항이 있으시면 언제든 연락주시기 바랍니다.</p>
            
            <p style="margin: 20px 0;">앞으로는 신청하신 프로그램에 성실히 참여해 주시기 바랍니다.</p>
            
            <p style="margin: 30px 0 0 0; font-weight: bold;">감사합니다.</p>
          </div>
          
          <div class="footer">
            <p><strong>인천 Connect Hub 운영팀</strong></p>
            <p>📧 이 메일은 자동으로 발송된 메일입니다.</p>
            <p>문의사항이 있으시면 관리자에게 연락해 주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `
  } else {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px; 
            border-radius: 12px; 
            text-align: center; 
            margin-bottom: 30px;
          }
          .content { 
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .success { 
            background: #f0fdf4; 
            border-left: 4px solid #22c55e;
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            padding-top: 30px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎓 인천 Connect Hub</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">프로그램 신청 제한 해제 안내</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">안녕하세요, <strong>${userName}</strong>님</p>
            
            <div class="success">
              <h3 style="color: #16a34a; margin-top: 0; font-size: 18px;">✅ 프로그램 신청 제한이 해제되었습니다!</h3>
              <p style="margin: 15px 0;">이제 모든 프로그램에 정상적으로 신청하실 수 있습니다.</p>
            </div>
            
            <p style="margin: 20px 0;">제한 기간이 종료되어 다시 인천 Connect Hub의 모든 프로그램에 참여하실 수 있게 되었습니다.</p>
            
            <p style="margin: 20px 0;">앞으로도 인천 Connect Hub의 다양한 프로그램에 적극적으로 참여해 주시기 바라며, 신청하신 프로그램에는 꼭 참석해 주시기 바랍니다.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="cta-button">프로그램 보러가기 →</a>
            </div>
            
            <p style="margin: 30px 0 0 0; font-weight: bold;">감사합니다.</p>
          </div>
          
          <div class="footer">
            <p><strong>인천 Connect Hub 운영팀</strong></p>
            <p>📧 이 메일은 자동으로 발송된 메일입니다.</p>
            <p>문의사항이 있으시면 관리자에게 연락해 주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}