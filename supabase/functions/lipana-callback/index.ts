// LipaNa STK Push callback — receives async payment confirmation from LipaNa.dev
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({} as any));
    console.log("LipaNa callback:", JSON.stringify(payload));

    // Try common field shapes
    const checkoutId =
      payload.checkout_id || payload.CheckoutRequestID || payload.checkoutRequestID ||
      payload.data?.checkout_id || payload.data?.CheckoutRequestID || payload.data?.checkoutRequestID || null;
    const reference =
      payload.reference || payload.bookingId ||
      payload.data?.reference || payload.metadata?.reference || null;
    const transactionId = payload.transactionId || payload.transaction_id || payload.data?.transactionId || payload.data?.transaction_id || null;
    const status = String(payload.status || payload.result || payload.event || payload.data?.status || "").toLowerCase();
    const receipt =
      payload.mpesa_receipt || payload.receipt || payload.MpesaReceiptNumber ||
      payload.data?.mpesa_receipt || payload.data?.receipt || null;
    const success =
      payload.success === true || status.includes("success") || status === "completed" || status === "paid" || !!receipt;
    const failed = status.includes("failed") || status.includes("cancel") || payload.success === false;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let bookingQuery = admin.from("bookings").select("id, transaction_code");
    if (checkoutId) bookingQuery = bookingQuery.eq("mpesa_checkout_id", checkoutId);
    else if (reference) bookingQuery = bookingQuery.eq("id", reference);
    else return new Response(JSON.stringify({ ok: true, note: "no identifier" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: bookings } = await bookingQuery.limit(1);
    const booking = bookings?.[0];
    if (!booking) {
      return new Response(JSON.stringify({ ok: true, note: "booking not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("bookings").update({
      payment_status: success ? "paid" : (failed ? "failed" : "pending"),
      mpesa_receipt: receipt || null,
      transaction_code: receipt || transactionId || booking.transaction_code,
    }).eq("id", booking.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Callback error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
