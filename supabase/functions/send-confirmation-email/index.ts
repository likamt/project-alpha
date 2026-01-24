import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, token, email_action_type, user_name, redirect_to } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    console.log('Sending email to:', email)
    console.log('Email action type:', email_action_type)

    // Generate OTP code instead of using token/link
    const otpCode = token || generateOTP();

    const html = generateEmailHTML({
      email_action_type: email_action_type || 'signup',
      user_name,
      otpCode,
    })

    const { data, error } = await resend.emails.send({
      from: 'خدمة سريعة <onboarding@resend.dev>',
      to: [email],
      subject: getEmailSubject(email_action_type || 'signup'),
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data, otpCode }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  } catch (error: any) {
    console.error('Error in send-confirmation-email:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})

function getEmailSubject(emailActionType: string): string {
  switch (emailActionType) {
    case 'signup':
    case 'email':
      return 'رمز التحقق - خدمة سريعة'
    case 'recovery':
      return 'رمز استرجاع كلمة المرور - خدمة سريعة'
    case 'invite':
      return 'دعوة للانضمام - خدمة سريعة'
    case 'order_confirmation':
      return 'تأكيد طلبك - خدمة سريعة'
    case 'new_order':
      return 'لديك طلب جديد! - خدمة سريعة'
    case 'subscription_reminder':
      return 'تذكير بتجديد الاشتراك - خدمة سريعة'
    default:
      return 'رسالة من خدمة سريعة'
  }
}

interface EmailContent {
  email_action_type: string
  user_name?: string
  otpCode?: string
}

function generateEmailHTML({ email_action_type, user_name, otpCode }: EmailContent): string {
  const getContent = () => {
    switch (email_action_type) {
      case 'signup':
      case 'email':
        return {
          heading: 'مرحباً بك في خدمة سريعة! 🎉',
          description: 'شكراً لانضمامك إلى منصتنا. لتفعيل حسابك، يرجى إدخال الرمز التالي:',
          showOTP: true,
        }
      case 'recovery':
        return {
          heading: 'استرجاع كلمة المرور',
          description: 'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. أدخل الرمز التالي لإنشاء كلمة مرور جديدة:',
          showOTP: true,
        }
      case 'order_confirmation':
        return {
          heading: 'تم استلام طلبك! ✅',
          description: 'شكراً لثقتك بنا. سيتم معالجة طلبك في أقرب وقت.',
          showOTP: false,
        }
      case 'new_order':
        return {
          heading: 'لديك طلب جديد! 🔔',
          description: 'تم استلام طلب جديد. يرجى مراجعته والرد في أقرب وقت.',
          showOTP: false,
        }
      case 'subscription_reminder':
        return {
          heading: 'تذكير بتجديد الاشتراك ⏰',
          description: 'اشتراكك سينتهي قريباً. يرجى تجديده للاستمرار في استقبال الطلبات.',
          showOTP: false,
        }
      default:
        return {
          heading: 'مرحباً!',
          description: 'لديك رسالة مهمة من خدمة سريعة.',
          showOTP: false,
        }
    }
  }

  const content = getContent()
  const greeting = user_name ? `مرحباً ${user_name}،` : ''

  // Format OTP code with spaces for better readability
  const formattedOTP = otpCode ? otpCode.split('').join(' ') : ''

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Tahoma, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">خدمة سريعة</h1>
              <p style="color: #dcfce7; font-size: 14px; margin: 8px 0 0 0;">منصة الخدمات المنزلية</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="color: #1f2937; font-size: 26px; font-weight: bold; text-align: center; margin: 0 0 24px 0;">
                ${content.heading}
              </h2>
              
              ${greeting ? `<p style="color: #4b5563; font-size: 18px; line-height: 28px; text-align: center; margin: 16px 0;">${greeting}</p>` : ''}
              
              <p style="color: #4b5563; font-size: 16px; line-height: 28px; text-align: center; margin: 16px 0 32px 0;">
                ${content.description}
              </p>
              
              <!-- OTP Code Box -->
              ${content.showOTP && otpCode ? `
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 16px; padding: 24px 48px;">
                  <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; letter-spacing: 1px;">رمز التحقق</p>
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 16px 32px; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);">
                    <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #16a34a; letter-spacing: 8px;">
                      ${formattedOTP}
                    </span>
                  </div>
                </div>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
                ⏱️ هذا الرمز صالح لمدة 10 دقائق فقط
              </p>
              ` : ''}
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px 20px; margin: 32px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
                  🔒 لا تشارك هذا الرمز مع أي شخص. فريق خدمة سريعة لن يطلب منك الرمز أبداً.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 4px 0;">
                إذا لم تطلب هذا البريد، يمكنك تجاهله بأمان.
              </p>
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 4px 0;">
                © ${new Date().getFullYear()} خدمة سريعة - جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
