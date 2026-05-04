// LipaNa STK Push — initiates an M-Pesa prompt on the customer's phone
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIPANA_BASE = "https://api.lipana.dev";

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

    const body = await req.json();
    const { bookingId, phone, amount } = body ?? {};
    if (!bookingId || !phone || !amount) return json({ error: "Missing bookingId, phone or amount" }, 400);

    const normalizedPhone = normalizeMsisdn(String(phone));
    if (!normalizedPhone) return json({ error: "Invalid phone number" }, 400);

    const secret = Deno.env.get("LIPANA_SECRET_KEY");
    if (!secret) return json({ error: "Payment provider not configured" }, 500);

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/lipana-callback`;

    // LipaNa STK Push request
    const stkRes = await fetch(`${LIPANA_BASE}/v1/stk/push`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        amount: Math.round(Number(amount)),
        reference: bookingId,
        description: `Nyali Shore Booking ${bookingId.slice(0, 8)}`,
        callback_url: callbackUrl,
      }),
    });

    const stkData = await stkRes.json().catch(() => ({}));
    if (!stkRes.ok) {
      console.error("LipaNa error:", stkRes.status, stkData);
      return json({ error: stkData?.message || "Payment request failed", details: stkData }, stkRes.status);
    }

    const checkoutId = stkData.checkout_id || stkData.CheckoutRequestID || stkData.id || null;

    // Persist checkout id on booking
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await admin.from("bookings")
      .update({
        mpesa_checkout_id: checkoutId,
        phone_number: normalizedPhone,
        payment_status: "prompt_sent",
      })
      .eq("id", bookingId);

    return json({ success: true, checkoutId, message: "STK Push sent — check your phone and enter your M-Pesa PIN." });
  } catch (e: any) {
    console.error("STK push error:", e);
    return json({ error: e?.message || "Unexpected error" }, 500);
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
