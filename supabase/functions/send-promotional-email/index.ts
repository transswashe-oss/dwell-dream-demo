import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { promotionId, subject, body } = await req.json();
    if (!subject || !body) throw new Error("Missing subject or body");

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch active subscribers
    const { data: subs, error: subErr } = await supabase
      .from("subscribers")
      .select("email")
      .eq("active", true);
    if (subErr) throw subErr;

    const recipients = (subs ?? []).map((s) => s.email);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No active subscribers" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    const html = emailLayout({
      title: "🎁 Special Offer Just for You",
      bannerColor: "#10B981",
      bodyHtml: `
        <div style="font-size:15px;line-height:1.7;color:#374151;">${body}</div>
        <p style="text-align:center;margin:28px 0;">
          <a href="${BRAND.siteUrl}/apartments" style="display:inline-block;background:#0891B2;background-image:linear-gradient(135deg,#0891B2 0%,#164E63 100%);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Browse Apartments →</a>
        </p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
        <p style="font-size:12px;color:#9CA3AF;text-align:center;">You're receiving this because you subscribed to ${BRAND.name} offers. To unsubscribe, reply with "unsubscribe".</p>
      `,
    });

    let sent = 0;
    let failed = 0;
    // Send individually with BCC-style isolation (one email per recipient to keep addresses private)
    for (const to of recipients) {
      try {
        await client.send({
          from: `${BRAND.name} <${gmailUser}>`,
          to,
          subject,
          html,
        });
        sent++;
      } catch (e) {
        console.error("Failed to send to", to, e);
        failed++;
      }
    }

    await client.close();

    // Update promotion record if provided
    if (promotionId) {
      await supabase
        .from("promotional_messages")
        .update({ sent: true, sent_at: new Date().toISOString(), recipient_count: sent })
        .eq("id", promotionId);
    }

    return new Response(JSON.stringify({ success: true, sent, failed, total: recipients.length }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-promotional-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
