import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-REMINDER-CRON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Cron job started - checking expiring subscriptions");

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Get providers expiring within 3 days
    const [cooksResult, workersResult] = await Promise.all([
      supabaseClient
        .from("home_cooks")
        .select(`
          id, user_id, subscription_status, subscription_ends_at,
          profile:profiles(full_name)
        `)
        .in("subscription_status", ["active", "trial"])
        .lte("subscription_ends_at", threeDaysFromNow.toISOString())
        .gt("subscription_ends_at", now.toISOString()),
      supabaseClient
        .from("house_workers")
        .select(`
          id, user_id, subscription_status, subscription_ends_at,
          profile:profiles(full_name)
        `)
        .in("subscription_status", ["active", "trial"])
        .lte("subscription_ends_at", threeDaysFromNow.toISOString())
        .gt("subscription_ends_at", now.toISOString()),
    ]);

    const expiringCooks = cooksResult.data || [];
    const expiringWorkers = workersResult.data || [];

    logStep("Found expiring subscriptions", {
      cooks: expiringCooks.length,
      workers: expiringWorkers.length,
    });

    // Check which users already received a reminder today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allUserIds = [
      ...expiringCooks.map((c) => c.user_id),
      ...expiringWorkers.map((w) => w.user_id),
    ];

    if (allUserIds.length === 0) {
      logStep("No expiring subscriptions found");
      return new Response(
        JSON.stringify({ success: true, message: "No expiring subscriptions", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check for existing reminders sent today
    const { data: existingReminders } = await supabaseClient
      .from("notifications")
      .select("user_id")
      .in("user_id", allUserIds)
      .eq("type", "subscription_reminder_auto")
      .gte("created_at", today.toISOString());

    const alreadyNotifiedUsers = new Set(existingReminders?.map((n) => n.user_id) || []);

    // Prepare notifications for users who haven't been notified today
    const notifications: any[] = [];

    for (const cook of expiringCooks) {
      if (alreadyNotifiedUsers.has(cook.user_id)) continue;

      const daysLeft = Math.ceil(
        (new Date(cook.subscription_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      notifications.push({
        user_id: cook.user_id,
        title: `⏰ تذكير: اشتراكك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}`,
        message: `مرحباً ${(cook.profile as any)?.full_name || ""}، اشتراكك سينتهي قريباً. جدد اشتراكك للاستمرار في استقبال الطلبات.`,
        type: "subscription_reminder_auto",
        priority: "high",
        link: "/cook-dashboard",
        metadata: { days_left: daysLeft, subscription_ends_at: cook.subscription_ends_at },
      });
    }

    for (const worker of expiringWorkers) {
      if (alreadyNotifiedUsers.has(worker.user_id)) continue;

      const daysLeft = Math.ceil(
        (new Date(worker.subscription_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      notifications.push({
        user_id: worker.user_id,
        title: `⏰ تذكير: اشتراكك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}`,
        message: `مرحباً ${(worker.profile as any)?.full_name || ""}، اشتراكك سينتهي قريباً. جدد اشتراكك للاستمرار في استقبال الطلبات.`,
        type: "subscription_reminder_auto",
        priority: "high",
        link: "/worker-dashboard",
        metadata: { days_left: daysLeft, subscription_ends_at: worker.subscription_ends_at },
      });
    }

    if (notifications.length === 0) {
      logStep("All expiring users already notified today");
      return new Response(
        JSON.stringify({ success: true, message: "All users already notified today", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Insert notifications
    const { error: insertError } = await supabaseClient
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      logStep("Error inserting notifications", { error: insertError.message });
      throw insertError;
    }

    logStep("Notifications sent successfully", { count: notifications.length });

    // Optional: Send email notifications via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      for (const notification of notifications) {
        try {
          // Get user email
          const { data: userData } = await supabaseClient.auth.admin.getUserById(notification.user_id);
          
          if (userData?.user?.email) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "خدمة سريعة <onboarding@resend.dev>",
                to: [userData.user.email],
                subject: notification.title,
                html: generateReminderEmail(notification),
              }),
            });
            logStep("Email sent", { user_id: notification.user_id });
          }
        } catch (emailError) {
          logStep("Email send error", { error: emailError });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${notifications.length} reminder notifications`,
        sent: notifications.length,
        details: {
          cooks: expiringCooks.length,
          workers: expiringWorkers.length,
          skipped: alreadyNotifiedUsers.size,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function generateReminderEmail(notification: any): string {
  const daysLeft = notification.metadata?.days_left || 3;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Tahoma, Arial, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">⏰ تذكير هام</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="color: #1f2937; font-size: 24px; text-align: center; margin: 0 0 24px 0;">
                اشتراكك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}!
              </h2>
              
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="color: #92400e; font-size: 18px; margin: 0; font-weight: bold;">
                  جدد اشتراكك الآن للاستمرار في استقبال الطلبات
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 28px; text-align: center; margin: 24px 0;">
                لن تتمكن من استقبال طلبات جديدة بعد انتهاء الاشتراك. 
                جدد الآن لتجنب أي انقطاع في خدماتك.
              </p>
              
              <table width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://pro-hub-core.lovable.app${notification.link}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); border-radius: 8px; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; padding: 16px 48px;">
                      تجديد الاشتراك
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
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
  `;
}
