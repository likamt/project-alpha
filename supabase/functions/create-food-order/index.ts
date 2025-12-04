import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_PERCENT = 10; // نسبة رسوم المنصة 10%

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-FOOD-ORDER] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { dish_id, quantity, delivery_address, delivery_notes, scheduled_delivery_at } = await req.json();
    if (!dish_id || !quantity) throw new Error("Missing required fields: dish_id, quantity");
    logStep("Request body parsed", { dish_id, quantity });

    // Fetch dish details
    const { data: dish, error: dishError } = await supabaseClient
      .from("food_dishes")
      .select(`
        *,
        cook:home_cooks(
          id,
          user_id,
          profile:profiles(full_name, email)
        )
      `)
      .eq("id", dish_id)
      .single();

    if (dishError || !dish) throw new Error("Dish not found");
    if (!dish.is_available) throw new Error("Dish is not available");
    logStep("Dish fetched", { dishId: dish.id, price: dish.price, cookId: dish.cook?.id });

    // Calculate amounts
    const unitPrice = Number(dish.price);
    const totalAmount = unitPrice * quantity;
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT) / 100;
    const cookAmount = totalAmount - platformFee;
    logStep("Amounts calculated", { totalAmount, platformFee, cookAmount });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check/Create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = newCustomer.id;
    }
    logStep("Stripe customer ready", { customerId });

    // Create order in database first
    const { data: order, error: orderError } = await supabaseClient
      .from("food_orders")
      .insert({
        client_id: user.id,
        cook_id: dish.cook.id,
        dish_id: dish.id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        platform_fee: platformFee,
        cook_amount: cookAmount,
        delivery_address,
        delivery_notes,
        scheduled_delivery_at,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);
    logStep("Order created", { orderId: order.id });

    // Create Stripe Checkout session with manual capture for escrow
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "mad",
            product_data: {
              name: dish.name,
              description: `${quantity}x ${dish.name} - ${dish.cook?.profile?.full_name || 'طاهية'}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual", // Important: Manual capture for escrow
        metadata: {
          order_id: order.id,
          cook_id: dish.cook.id,
          platform_fee: platformFee.toString(),
          cook_amount: cookAmount.toString(),
        },
      },
      success_url: `${req.headers.get("origin")}/order-success?order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/home-cooking`,
      metadata: {
        order_id: order.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update order with payment intent
    if (session.payment_intent) {
      await supabaseClient
        .from("food_orders")
        .update({ stripe_payment_intent_id: session.payment_intent as string })
        .eq("id", order.id);
    }

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        order_id: order.id,
        session_id: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
