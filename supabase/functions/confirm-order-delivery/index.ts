import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-ORDER-DELIVERY] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get request body
    const { order_id, role } = await req.json();
    if (!order_id || !role) throw new Error("Missing required fields: order_id, role");
    if (!["client", "cook"].includes(role)) throw new Error("Invalid role");
    logStep("Request parsed", { order_id, role });

    // Fetch order with cook details
    const { data: order, error: orderError } = await supabaseClient
      .from("food_orders")
      .select(`
        *,
        cook:home_cooks(user_id),
        dish:food_dishes(name)
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    logStep("Order fetched", { orderId: order.id, status: order.status });

    // Verify user is authorized
    const isCook = order.cook?.user_id === user.id;
    const isClient = order.client_id === user.id;

    if (role === "client" && !isClient) throw new Error("Unauthorized: Not the client");
    if (role === "cook" && !isCook) throw new Error("Unauthorized: Not the cook");

    // Update confirmation timestamp
    const updateData: any = {};
    if (role === "client") {
      updateData.client_confirmed_at = new Date().toISOString();
    } else {
      updateData.cook_confirmed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("food_orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) throw new Error(`Update failed: ${updateError.message}`);
    logStep("Confirmation updated", { role, ...updateData });

    // Refetch order to check both confirmations
    const { data: updatedOrder, error: refetchError } = await supabaseClient
      .from("food_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (refetchError) throw new Error("Failed to refetch order");

    // Check if both parties confirmed - if so, release escrow
    if (updatedOrder.client_confirmed_at && updatedOrder.cook_confirmed_at) {
      logStep("Both parties confirmed, releasing escrow");

      // Initialize Stripe
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      // Capture the payment (release escrow)
      if (updatedOrder.stripe_payment_intent_id) {
        try {
          await stripe.paymentIntents.capture(updatedOrder.stripe_payment_intent_id);
          logStep("Payment captured successfully");
        } catch (stripeError: any) {
          logStep("Stripe capture error", { message: stripeError.message });
          // Payment might already be captured, continue with order update
        }
      }

      // Generate receipt
      const receiptData = {
        order_id: order_id,
        dish_name: order.dish?.name,
        quantity: order.quantity,
        unit_price: order.unit_price,
        total_amount: order.total_amount,
        platform_fee: order.platform_fee,
        cook_amount: order.cook_amount,
        completed_at: new Date().toISOString(),
      };

      // Update order to completed
      await supabaseClient
        .from("food_orders")
        .update({
          status: "completed",
          payment_status: "released",
          escrow_released_at: new Date().toISOString(),
          receipt_generated_at: new Date().toISOString(),
          receipt_data: receiptData,
        })
        .eq("id", order_id);

      logStep("Order completed and escrow released");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order completed, payment released",
          receipt: receiptData,
          escrow_released: true 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${role === "client" ? "Client" : "Cook"} confirmation recorded`,
        client_confirmed: !!updatedOrder.client_confirmed_at,
        cook_confirmed: !!updatedOrder.cook_confirmed_at,
        escrow_released: false 
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
