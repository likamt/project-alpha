import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { provider_type } = await req.json();
    if (!provider_type || !["house_worker", "home_cook"].includes(provider_type)) {
      throw new Error("Invalid provider type");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      // Check if still in trial period
      const table = provider_type === "home_cook" ? "home_cooks" : "house_workers";
      const { data: provider } = await supabaseClient
        .from(table)
        .select("subscription_status, subscription_ends_at")
        .eq("user_id", user.id)
        .single();

      if (provider) {
        const trialEndsAt = new Date(provider.subscription_ends_at);
        const now = new Date();
        
        if (provider.subscription_status === "trial" && trialEndsAt > now) {
          const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return new Response(
            JSON.stringify({
              subscribed: true,
              status: "trial",
              trial_ends_at: provider.subscription_ends_at,
              days_left: daysLeft,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }

      return new Response(
        JSON.stringify({ subscribed: false, status: "expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check trial status in database
      const table = provider_type === "home_cook" ? "home_cooks" : "house_workers";
      const { data: provider } = await supabaseClient
        .from(table)
        .select("subscription_status, subscription_ends_at")
        .eq("user_id", user.id)
        .single();

      if (provider && provider.subscription_status === "trial") {
        const trialEndsAt = new Date(provider.subscription_ends_at);
        const now = new Date();
        
        if (trialEndsAt > now) {
          const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return new Response(
            JSON.stringify({
              subscribed: true,
              status: "trial",
              trial_ends_at: provider.subscription_ends_at,
              days_left: daysLeft,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }

      return new Response(
        JSON.stringify({ subscribed: false, status: "no_subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const subscription = subscriptions.data[0];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Update database with subscription info
    const table = provider_type === "home_cook" ? "home_cooks" : "house_workers";
    await supabaseClient
      .from(table)
      .update({
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id,
        subscription_ends_at: subscriptionEnd,
      })
      .eq("user_id", user.id);

    logStep("Subscription status", { status: subscription.status });

    return new Response(
      JSON.stringify({
        subscribed: ["active", "trialing"].includes(subscription.status),
        status: subscription.status,
        subscription_end: subscriptionEnd,
        trial_end: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString() 
          : null,
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
