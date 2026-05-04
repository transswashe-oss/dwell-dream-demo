// Validate a discount code and return computed amount off
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { code, subtotal } = await req.json();
    if (!code || typeof subtotal !== "number") return j({ error: "Missing code or subtotal" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("active", true)
      .ilike("code", code.trim())
      .maybeSingle();

    if (error || !data) return j({ valid: false, error: "Invalid or inactive code" }, 200);

    const now = new Date();
    if (data.starts_at && new Date(data.starts_at) > now) return j({ valid: false, error: "Code not yet active" });
    if (data.ends_at && new Date(data.ends_at) < now) return j({ valid: false, error: "Code expired" });

    let discountAmount = 0;
    if (data.discount_type === "percentage") {
      discountAmount = Math.round((subtotal * Number(data.amount)) / 100);
    } else {
      discountAmount = Math.round(Number(data.amount));
    }
    discountAmount = Math.min(discountAmount, subtotal);

    return j({
      valid: true,
      code: data.code,
      discount_type: data.discount_type,
      amount: Number(data.amount),
      discountAmount,
      newTotal: Math.max(0, subtotal - discountAmount),
      description: data.description,
    });
  } catch (e: any) {
    return j({ error: e?.message || "error" }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
