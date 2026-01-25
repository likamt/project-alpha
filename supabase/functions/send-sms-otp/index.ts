import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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
    const { phone, user_name } = await req.json()

    if (!phone) {
      throw new Error('Phone number is required')
    }

    console.log('Sending SMS OTP to:', phone)

    // Generate OTP code
    const otpCode = generateOTP();

    // Check if TWILIO credentials are available
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('Twilio credentials not configured. Returning OTP for testing.');
      
      // Return OTP for testing when Twilio is not configured
      return new Response(
        JSON.stringify({ 
          success: true, 
          otpCode,
          message: 'SMS provider not configured. OTP generated for testing.',
          testMode: true
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = phone.replace(/\s/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Default to Morocco country code if not provided
      formattedPhone = '+212' + formattedPhone.replace(/^0/, '');
    }

    // SMS message in Arabic
    const message = `خدمة سريعة: رمز التحقق الخاص بك هو ${otpCode}. صالح لمدة 10 دقائق. لا تشاركه مع أي شخص.`;

    // Send SMS via Twilio
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhoneNumber,
          Body: message,
        }),
      }
    );

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      throw new Error(twilioResult.message || 'Failed to send SMS');
    }

    console.log('SMS sent successfully:', twilioResult.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        otpCode,
        messageSid: twilioResult.sid 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  } catch (error: any) {
    console.error('Error in send-sms-otp:', error)
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
