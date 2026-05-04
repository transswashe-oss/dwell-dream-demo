import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch a snapshot of properties + settings to give the model context
    const [{ data: apts }, { data: settings }] = await Promise.all([
      supabase.from("apartments").select("id,name,type,location,price,monthly_price,rooms,bathrooms,max_occupancy,available,description").eq("available", true).limit(30),
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const aptCatalog = (apts || []).map((a: any) =>
      `- [${a.id}] ${a.name} (${a.location}) | ${a.rooms}BR/${a.bathrooms}BA | sleeps ${a.max_occupancy} | KSh ${a.price}/night${a.monthly_price ? `, KSh ${a.monthly_price}/month` : ''} | ${a.description?.slice(0, 120) || ''}`
    ).join("\n");

    const systemPrompt = `You are NyaliBot, the friendly AI concierge for Nyali Shore Real Estate (Mombasa, Kenya).
We offer BOTH short-stay (per-night, Airbnb-style) AND long-term rentals (per-month).
Contact: ${settings?.contact_email || 'omaryw003@gmail.com'} • ${settings?.contact_phone || '+254 725 409 996'}

Available properties:
${aptCatalog}

When a user asks about properties, recommend specific ones from the list above by name and include the property id in this exact tag at the end of your message: [APT:<id>] for each recommendation (you can include multiple). Keep replies concise, warm, and helpful. If asked about booking, explain: pick a property, choose per-night or per-month, and pay instantly via M-Pesa STK Push (we send a prompt to your phone — just enter your PIN). Admin then confirms the booking. For questions outside real-estate, politely steer back to bookings/properties.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      throw new Error("AI gateway error");
    }

    const data = await resp.json();
    const reply: string = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.";

    // Extract apartment IDs from the model's response
    const ids = Array.from(reply.matchAll(/\[APT:([0-9a-f-]{36})\]/gi)).map((m) => m[1]);
    let recommendations: any[] = [];
    if (ids.length > 0) {
      const { data: recs } = await supabase
        .from("apartments")
        .select("id,name,location,price,monthly_price,display_image,rooms,bathrooms")
        .in("id", ids);
      recommendations = recs || [];
    }
    const cleanReply = reply.replace(/\[APT:[0-9a-f-]{36}\]/gi, "").trim();

    return new Response(JSON.stringify({ reply: cleanReply, recommendations }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
