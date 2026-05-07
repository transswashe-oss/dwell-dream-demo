import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { location } = await req.json();
    if (!location || typeof location !== "string") {
      return new Response(JSON.stringify({ error: "location required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Ask AI to produce the most precise place query string for Google Maps
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You return ONLY a precise Google Maps place query for a property location in Mombasa, Kenya. Respond with the place name plus 'Mombasa, Kenya' — nothing else, no quotes, no explanation." },
          { role: "user", content: `Location: ${location}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      // Fallback: just use the raw location
      const q = encodeURIComponent(`${location}, Mombasa, Kenya`);
      return new Response(JSON.stringify({
        google_maps_url: `https://www.google.com/maps?q=${q}`,
        embed_url: `https://www.google.com/maps?q=${q}&output=embed`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const refined = (aiData.choices?.[0]?.message?.content || `${location}, Mombasa, Kenya`).trim();
    const q = encodeURIComponent(refined);

    return new Response(JSON.stringify({
      query: refined,
      google_maps_url: `https://www.google.com/maps?q=${q}`,
      embed_url: `https://www.google.com/maps?q=${q}&output=embed`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
