// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not found')
    }

    const emailData = {
      from: 'onboarding@resend.dev',
      to: ['digicon84@gmail.com'], // Resend 계정 소유자 이메일로 변경
      subject: '인천에듀 - 이메일 테스트',
      html: `
        <h1>이메일 테스트</h1>
        <p>이메일 발송이 정상적으로 작동합니다!</p>
        <p>시간: ${new Date().toLocaleString('ko-KR')}</p>
      `
    }

    console.log('Sending test email...')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    console.log('Response status:', res.status)

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error:', errorText)
      throw new Error(`API Error: ${res.status} - ${errorText}`)
    }

    const result = await res.json()
    console.log('Success:', result)
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Test email error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})