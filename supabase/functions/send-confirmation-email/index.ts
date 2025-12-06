import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const confirmationLink = redirect_to || supabaseUrl

    const html = generateEmailHTML({
      email_action_type: email_action_type || 'signup',
      user_name,
      token,
      confirmationLink,
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
      JSON.stringify({ success: true, data }),
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
      return 'تأكيد بريدك الإلكتروني - خدمة سريعة'
    case 'recovery':
      return 'استرجاع كلمة المرور - خدمة سريعة'
    case 'invite':
      return 'دعوة للانضمام - خدمة سريعة'
    case 'order_confirmation':
      return 'تأكيد طلبك - خدمة سريعة'
    case 'new_order':
      return 'لديك طلب جديد! - خدمة سريعة'
    default:
      return 'رسالة من خدمة سريعة'
  }
}

interface EmailContent {
  email_action_type: string
  user_name?: string
  token?: string
  confirmationLink?: string
}

function generateEmailHTML({ email_action_type, user_name, token, confirmationLink }: EmailContent): string {
  const getContent = () => {
    switch (email_action_type) {
      case 'signup':
      case 'email':
        return {
          heading: 'مرحباً بك في خدمة سريعة! 🎉',
          description: 'شكراً لانضمامك إلى منصتنا. لتفعيل حسابك، يرجى تأكيد بريدك الإلكتروني.',
          buttonText: 'تأكيد البريد الإلكتروني',
          showToken: true,
        }
      case 'recovery':
        return {
          heading: 'استرجاع كلمة المرور',
          description: 'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.',
          buttonText: 'إعادة تعيين كلمة المرور',
          showToken: true,
        }
      case 'order_confirmation':
        return {
          heading: 'تم استلام طلبك! ✅',
          description: 'شكراً لثقتك بنا. سيتم معالجة طلبك في أقرب وقت.',
          buttonText: 'عرض الطلب',
          showToken: false,
        }
      case 'new_order':
        return {
          heading: 'لديك طلب جديد! 🔔',
          description: 'تم استلام طلب جديد. يرجى مراجعته والرد في أقرب وقت.',
          buttonText: 'عرض الطلب',
          showToken: false,
        }
      default:
        return {
          heading: 'مرحباً!',
          description: 'لديك رسالة مهمة من خدمة سريعة.',
          buttonText: 'المتابعة',
          showToken: false,
        }
    }
  }

  const content = getContent()
  const greeting = user_name ? `مرحباً ${user_name}،` : ''

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
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">خدمة سريعة</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; text-align: center; margin: 0 0 20px 0;">
                ${content.heading}
              </h2>
              
              ${greeting ? `<p style="color: #4b5563; font-size: 16px; line-height: 26px; text-align: center; margin: 16px 0;">${greeting}</p>` : ''}
              
              <p style="color: #4b5563; font-size: 16px; line-height: 26px; text-align: center; margin: 16px 0;">
                ${content.description}
              </p>
              
              <!-- Button -->
              ${confirmationLink ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 40px;">
                      ${content.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Token -->
              ${content.showToken && token ? `
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 24px 0 8px 0;">
                أو انسخ هذا الرمز والصقه في التطبيق:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <code style="display: inline-block; padding: 16px 32px; background-color: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb; color: #1f2937; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
                      ${token}
                    </code>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 4px 0;">
                إذا لم تطلب هذا البريد، يمكنك تجاهله بأمان.
              </p>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 4px 0;">
                © 2024 خدمة سريعة - جميع الحقوق محفوظة
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