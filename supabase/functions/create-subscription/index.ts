import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription prices (created in Stripe)
const SUBSCRIPTION_PRICES = {
  house_worker: "price_1StATnBsrBqFMXCwFeQbkFjd", // 99 MAD/month
  home_cook: "price_1StAU1BsrBqFMXCwScNhNcNJ", // 99 MAD/month
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Provider type", { provider_type });

    const priceId = SUBSCRIPTION_PRICES[provider_type as keyof typeof SUBSCRIPTION_PRICES];
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id, provider_type },
      });
      customerId = newCustomer.id;
    }
    logStep("Stripe customer ready", { customerId });

    // Check if already has active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      logStep("Already subscribed");
      return new Response(
        JSON.stringify({ error: "Already have an active subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get origin from headers or use default
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || "https://pro-hub-core.lovable.app";
    logStep("Origin", { origin });

    // Create checkout session with 30-day free trial
    const dashboardPath = provider_type === "home_cook" ? "cook-dashboard" : "worker-dashboard";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30, // First month free!
        metadata: {
          provider_type,
          user_id: user.id,
        },
      },
      success_url: `${origin}/${dashboardPath}?subscription=success`,
      cancel_url: `${origin}/${dashboardPath}?subscription=cancelled`,
      metadata: {
        provider_type,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Update provider record with Stripe customer ID
    const table = provider_type === "home_cook" ? "home_cooks" : "house_workers";
    await supabaseClient
      .from(table)
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
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
