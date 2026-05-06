// LipaNa STK Push — initiates an M-Pesa prompt on the customer's phone
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LIPANA_ENDPOINTS = [
  "https://api.lipana.dev/v1/transactions/push-stk",
  "https://api.lipana.dev/api/transactions/push-stk",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { bookingId, phone, amount } = body ?? {};
    if (!bookingId || !phone || !amount) return json(paymentError("missing_fields", "Add your M-Pesa phone number before sending the payment prompt."));

    const normalizedPhone = normalizeMsisdn(String(phone));
    if (!normalizedPhone) return json(paymentError("invalid_phone", "Enter a valid Safaricom M-Pesa number, for example 07XXXXXXXX."));

    const secret = Deno.env.get("LIPANA_SECRET_KEY");
    if (!secret) return json(paymentError("provider_not_configured", "M-Pesa payments are not configured yet. Please contact Nyali Shore support."));

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, user_id, total_amount")
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError || !booking || booking.user_id !== user.id) {
      return json(paymentError("booking_not_found", "We could not verify this booking. Please refresh and try again."));
    }

    const payableAmount = Math.round(Number(booking.total_amount || amount));
    if (!Number.isFinite(payableAmount) || payableAmount < 10) {
      return json(paymentError("invalid_amount", "The payable amount must be at least KSh 10 for M-Pesa STK Push."));
    }

    let stkData: any = null;
    let stkStatus = 0;
    let lastError: unknown = null;

    for (const endpoint of LIPANA_ENDPOINTS) {
      try {
        const stkRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "x-api-key": secret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: `+${normalizedPhone}`,
            amount: payableAmount,
          }),
          signal: AbortSignal.timeout(20_000),
        });

        stkStatus = stkRes.status;
        stkData = await stkRes.json().catch(async () => ({ raw: await stkRes.text().catch(() => "") }));
        if (stkRes.ok) break;
        console.error("LipaNa error:", endpoint, stkRes.status, stkData);
        if (stkRes.status !== 404) break;
      } catch (err) {
        lastError = err;
        console.error("LipaNa request failed:", endpoint, err);
      }
    }

    if (!stkStatus || stkStatus < 200 || stkStatus >= 300) {
      await admin.from("bookings").update({ payment_status: "pending", phone_number: normalizedPhone }).eq("id", bookingId);
      return json(paymentError(mapLipanaCode(stkStatus, stkData, lastError), friendlyLipanaMessage(stkStatus, stkData, lastError), true, stkData));
    }

    const payload = stkData?.data || stkData || {};
    const checkoutId = payload.checkoutRequestID || payload.checkoutRequestId || payload.checkout_id || payload.CheckoutRequestID || stkData.checkout_id || stkData.id || null;
    const transactionId = payload.transactionId || payload.transaction_id || stkData.transactionId || null;

    await admin.from("bookings")
      .update({
        mpesa_checkout_id: checkoutId,
        phone_number: normalizedPhone,
        transaction_code: transactionId,
        payment_status: "pending",
      })
      .eq("id", bookingId);

    return json({ success: true, checkoutId, transactionId, message: "STK Push sent — check your phone and enter your M-Pesa PIN." });
  } catch (e: any) {
    console.error("STK push error:", e);
    return json(paymentError("service_error", "We could not send the M-Pesa prompt right now. Please try again in a minute.", true));
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeMsisdn(p: string): string | null {
  const digits = p.replace(/\D+/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  if (digits.startsWith("1") && digits.length === 9) return "254" + digits;
  return null;
}
