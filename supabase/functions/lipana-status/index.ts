// Check current payment_status for a booking (polled by client after STK push)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return j({ error: "Unauthorized" }, 401);

    const { bookingId } = await req.json();
    if (!bookingId) return j({ error: "Missing bookingId" }, 400);

    const { data, error } = await supabase
      .from("bookings")
      .select("payment_status, mpesa_receipt, transaction_code, status")
      .eq("id", bookingId)
      .maybeSingle();
    if (error) return j({ error: error.message }, 400);
    return j(data || {});
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
