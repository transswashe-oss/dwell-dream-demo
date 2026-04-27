import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, name } = await req.json();
    if (!email) throw new Error("Missing email");

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    const html = emailLayout({
      title: "Welcome Aboard! 🌊",
      preheader: `Welcome to ${BRAND.name}`,
      bodyHtml: `
        <p>Hi ${name || "there"},</p>
        <p>Welcome to <strong>${BRAND.name}</strong> — we're thrilled to have you join our coastal community!</p>
        <p>Your account is ready. You can now:</p>
        <ul>
          <li>🏝️ Browse hand-picked Airbnb apartments along Nyali shore</li>
          <li>📅 Book your perfect coastal getaway in seconds</li>
          <li>💸 Receive exclusive subscriber-only offers and discounts</li>
        </ul>
        <p style="text-align:center;margin:28px 0;">
          <a href="${BRAND.siteUrl}/apartments" style="display:inline-block;background:#0891B2;background-image:linear-gradient(135deg,#0891B2 0%,#164E63 100%);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Explore Apartments →</a>
        </p>
        <p>Need help? Reply to this email or reach us at ${BRAND.contactPhone}.</p>
        <p>See you on the shore,<br/>The ${BRAND.name} Team</p>
      `,
    });

    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: email,
      subject: `Welcome to ${BRAND.name}! 🌊`,
      content: `Welcome to ${BRAND.name}, ${name || ""}!`,
      html,
    });

    await client.close();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("send-welcome-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
