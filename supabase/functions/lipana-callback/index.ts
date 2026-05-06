// LipaNa STK Push callback — receives async payment confirmation from LipaNa.dev
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = toRecord(await req.json().catch(() => ({}))) || {};
    console.log("LipaNa callback:", JSON.stringify(payload));
    const data = toRecord(payload.data) || {};
    const metadata = toRecord(payload.metadata) || {};

    // Try common field shapes
    const checkoutId =
      payload.checkout_id || payload.CheckoutRequestID || payload.checkoutRequestID ||
      data.checkout_id || data.CheckoutRequestID || data.checkoutRequestID || null;
    const reference =
      payload.reference || payload.bookingId ||
      data.reference || metadata.reference || null;
    const transactionId = payload.transactionId || payload.transaction_id || data.transactionId || data.transaction_id || null;
    const status = String(payload.status || payload.result || payload.event || data.status || "").toLowerCase();
    const receipt =
      payload.mpesa_receipt || payload.receipt || payload.MpesaReceiptNumber ||
      data.mpesa_receipt || data.receipt || null;
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
  } catch (e: unknown) {
    console.error("Callback error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Callback error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}
