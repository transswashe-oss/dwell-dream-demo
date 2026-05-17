// Sends a daily AI-generated promotional email to all active subscribers.
// Scheduled via pg_cron at 05:00 UTC (08:00 EAT).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THEMES = [
  "Beachfront sunrise getaway in Nyali",
  "Romantic coastal escape for couples",
  "Family-friendly long-term coastal rental",
  "Mid-week short-stay with ocean views",
  "Workation by the Indian Ocean",
  "Weekend wellness retreat near the beach",
  "Affordable monthly rental in Mombasa coast",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!gmailUser || !gmailPassword) throw new Error("Email credentials not configured");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY missing");

    const { data: subs } = await supabase.from("subscribers").select("email").eq("active", true);
    const recipients = (subs ?? []).map((s) => s.email);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick a daily theme + tonal style based on day-of-year so it varies
    const today = new Date();
    const day = Math.floor((today.getTime() / 86400000)) % THEMES.length;
    const theme = THEMES[day];
    const accentColors = ["#0891B2", "#10B981", "#F59E0B", "#E11D48", "#7C3AED", "#0EA5E9", "#16A34A"];
    const banner = accentColors[day % accentColors.length];

    // Ask Lovable AI to generate a unique subject + HTML body
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You write SHORT promotional marketing emails for Nyali Shore Real Estate (Mombasa, Kenya). Always reply as JSON: {\"subject\":\"...\",\"headline\":\"...\",\"body_html\":\"...\",\"cta_text\":\"...\"}. body_html is ONE compact HTML string (<p>, <ul>, <strong> only, no <html>/<head>/<body>, max 800 chars). Make each day's email unique in tone, structure and angle. Keep it warm, coastal, persuasive. No emoji spam (max 2).",
          },
          {
            role: "user",
            content: `Today's theme: ${theme}. Date: ${today.toDateString()}. Generate the JSON now.`,
          },
        ],
      }),
    });

    let subject = `Nyali Shore — ${theme}`;
    let headline = theme;
    let bodyHtml = `<p>Discover our latest coastal stays and long-term rentals in Mombasa.</p>`;
    let ctaText = "Browse Apartments";

    if (aiRes.ok) {
      try {
        const aiData = await aiRes.json();
        const raw = aiData.choices?.[0]?.message?.content || "";
        const json = JSON.parse(raw.replace(/^```json|```$/g, "").trim());
        subject = json.subject || subject;
        headline = json.headline || headline;
        bodyHtml = json.body_html || bodyHtml;
        ctaText = json.cta_text || ctaText;
      } catch (e) {
        console.warn("AI parse failed, using fallback", e);
      }
    }

    const html = emailLayout({
      title: headline,
      bannerColor: banner,
      bodyHtml: `
        <div style="font-size:15px;line-height:1.7;color:#374151;">${bodyHtml}</div>
        <p style="text-align:center;margin:28px 0;">
          <a href="${BRAND.siteUrl}/apartments" style="display:inline-block;background:${banner};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">${ctaText} →</a>
        </p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
        <p style="font-size:12px;color:#9CA3AF;text-align:center;">You're receiving this because you subscribed to ${BRAND.name} offers. Reply "unsubscribe" to opt out.</p>
      `,
    });

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    let sent = 0, failed = 0;
    for (const to of recipients) {
      try {
        await client.send({ from: `${BRAND.name} <${gmailUser}>`, to, subject, html });
        sent++;
      } catch (e) {
        console.error("send fail", to, e);
        failed++;
      }
    }
    await client.close();

    await supabase.from("promotional_messages").insert({
      subject, body: bodyHtml, sent: true, sent_at: new Date().toISOString(), recipient_count: sent,
    });

    return new Response(JSON.stringify({ success: true, sent, failed, theme }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("daily-promo-email error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
