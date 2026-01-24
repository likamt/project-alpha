import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_message" | "new_order" | "order_update" | "new_booking" | "booking_update" | "new_rating";
  recipientId: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, recipientId, title, message, link, metadata, sendEmail } = await req.json() as NotificationRequest;

    // Validate input
    if (!recipientId || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine priority based on type
    let priority = "normal";
    if (type === "new_order" || type === "new_booking") {
      priority = "high";
    }

    // Insert notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: recipientId,
        type,
        title,
        message,
        link,
        priority,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (notifError) throw notifError;

    // Send email notification if requested and Resend is configured
    if (sendEmail && resendApiKey) {
      try {
        // Get user email
        const { data: user } = await supabase.auth.admin.getUserById(recipientId);
        
        if (user?.user?.email) {
          const resend = new Resend(resendApiKey);
          
          await resend.emails.send({
            from: "الخدمة السريعة <noreply@quickservice.ma>",
            to: user.user.email,
            subject: title,
            html: `
              <!DOCTYPE html>
              <html dir="rtl" lang="ar">
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
                  .content { padding: 30px; }
                  .message { font-size: 16px; line-height: 1.8; color: #333; }
                  .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
                  .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>${title}</h1>
                  </div>
                  <div class="content">
                    <p class="message">${message}</p>
                    ${link ? `<a href="${link}" class="button">عرض التفاصيل</a>` : ""}
                  </div>
                  <div class="footer">
                    <p>الخدمة السريعة - منصة الخدمات المنزلية</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
