import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  type: "new_order" | "order_status" | "order_completed" | "new_message";
  to_email: string;
  to_name: string;
  data: {
    order_id?: string;
    dish_name?: string;
    quantity?: number;
    total_amount?: number;
    status?: string;
    message_content?: string;
    sender_name?: string;
  };
}

const getEmailTemplate = (type: string, data: any, toName: string) => {
  switch (type) {
    case "new_order":
      return {
        subject: `🎉 طلب جديد: ${data.dish_name}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 طلب جديد!</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #374151;">مرحباً <strong>${toName}</strong>،</p>
              <p style="color: #6b7280;">لديك طلب جديد يحتاج مراجعتك:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>الطبق:</strong> ${data.dish_name}</p>
                <p style="margin: 8px 0;"><strong>الكمية:</strong> ${data.quantity}</p>
                <p style="margin: 8px 0;"><strong>المبلغ الإجمالي:</strong> ${data.total_amount} د.م</p>
              </div>
              <a href="https://pro-hub-core.lovable.app/home-cook-dashboard" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">مراجعة الطلب</a>
            </div>
          </div>
        `,
      };

    case "order_status":
      const statusLabels: Record<string, string> = {
        paid: "تم الدفع",
        preparing: "جاري التحضير",
        ready: "جاهز للتسليم",
        delivered: "تم التوصيل",
        cancelled: "ملغي",
      };
      return {
        subject: `تحديث حالة طلبك: ${statusLabels[data.status] || data.status}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📦 تحديث الطلب</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #374151;">مرحباً <strong>${toName}</strong>،</p>
              <p style="color: #6b7280;">تم تحديث حالة طلبك:</p>
              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 20px; color: #1e40af;"><strong>${statusLabels[data.status] || data.status}</strong></p>
              </div>
              <p style="margin: 8px 0;"><strong>الطبق:</strong> ${data.dish_name}</p>
              <a href="https://pro-hub-core.lovable.app/my-orders" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">متابعة طلباتي</a>
            </div>
          </div>
        `,
      };

    case "order_completed":
      return {
        subject: "✅ تم إكمال طلبك بنجاح!",
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ طلب مكتمل!</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #374151;">مرحباً <strong>${toName}</strong>،</p>
              <p style="color: #6b7280;">تم إكمال طلبك بنجاح! شكراً لاستخدامك منصتنا.</p>
              <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>الطبق:</strong> ${data.dish_name}</p>
                <p style="margin: 8px 0;"><strong>المبلغ:</strong> ${data.total_amount} د.م</p>
              </div>
              <p style="color: #6b7280; text-align: center;">نتمنى أن تكوني راضية عن الخدمة! 💚</p>
            </div>
          </div>
        `,
      };

    case "new_message":
      return {
        subject: `💬 رسالة جديدة من ${data.sender_name}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💬 رسالة جديدة</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #374151;">مرحباً <strong>${toName}</strong>،</p>
              <p style="color: #6b7280;">لديك رسالة جديدة من <strong>${data.sender_name}</strong>:</p>
              <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #8b5cf6;">
                <p style="margin: 0; color: #374151;">${data.message_content}</p>
              </div>
              <a href="https://pro-hub-core.lovable.app/messages" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">الرد على الرسالة</a>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "إشعار من منصتنا",
        html: `<p>لديك إشعار جديد</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to_email, to_name, data }: EmailNotificationRequest = await req.json();

    if (!to_email || !type) {
      throw new Error("Missing required fields: to_email and type");
    }

    const template = getEmailTemplate(type, data, to_name);

    // Note: You need to verify your domain at https://resend.com/domains
    // For testing, you can use the Resend test domain
    const emailResponse = await resend.emails.send({
      from: "ProHub <noreply@resend.dev>", // Change to your verified domain
      to: [to_email],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
