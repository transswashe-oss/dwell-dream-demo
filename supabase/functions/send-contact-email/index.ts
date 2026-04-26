import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escape = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function logEmail(row: { recipient: string; subject: string; template: string; status: string; error?: string; related_id?: string }) {
  try { await admin.from("email_logs").insert(row); } catch (e) { console.error("log error", e); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, phone, message, message_id } = await req.json();
    if (!name || !email || !message) throw new Error("Missing required fields");

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");

    await logEmail({ recipient: BRAND.adminEmail, subject: `New Contact: ${name}`, template: "contact-admin", status: "queued", related_id: message_id });
    await logEmail({ recipient: email, subject: `We received your message — ${BRAND.name}`, template: "contact-ack", status: "queued", related_id: message_id });

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    const adminHtml = emailLayout({
      title: "📩 New Contact Form Submission",
      bannerColor: "#F59E0B",
      bodyHtml: `
        <p>You received a new message via the website contact form:</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#F9FAFB;border-radius:8px;">
          <tr><td style="color:#6B7280;width:120px;">Name:</td><td style="font-weight:600;">${escape(name)}</td></tr>
          <tr><td style="color:#6B7280;">Email:</td><td><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
          <tr><td style="color:#6B7280;">Phone:</td><td>${escape(phone || "Not provided")}</td></tr>
        </table>
        <h3 style="margin-top:20px;color:#111827;">Message:</h3>
        <div style="background:#F0FDF4;border-left:4px solid #22C55E;padding:14px;border-radius:4px;white-space:pre-wrap;">${escape(message)}</div>
        <p style="margin-top:20px;font-size:13px;color:#6B7280;">Reply directly to this client at <a href="mailto:${escape(email)}">${escape(email)}</a>.</p>
      `,
    });

    try {
      await client.send({
        from: `${BRAND.name} <${gmailUser}>`,
        to: BRAND.adminEmail,
        replyTo: email,
        subject: `New Contact: ${name}`,
        content: `New contact form submission from ${name}`,
        html: adminHtml,
      });
      await logEmail({ recipient: BRAND.adminEmail, subject: `New Contact: ${name}`, template: "contact-admin", status: "sent", related_id: message_id });
    } catch (err: any) {
      await logEmail({ recipient: BRAND.adminEmail, subject: `New Contact: ${name}`, template: "contact-admin", status: "failed", error: String(err?.message || err), related_id: message_id });
      throw err;
    }

    const userHtml = emailLayout({
      title: "We Received Your Message ✅",
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Thanks for reaching out to <strong>${BRAND.name}</strong>! We've received your message and our team will get back to you within 24 hours.</p>
        <div style="background:#F9FAFB;border-radius:8px;padding:14px;margin:20px 0;">
          <p style="margin:0 0 8px;font-weight:600;color:#111827;">Your message:</p>
          <p style="margin:0;color:#374151;white-space:pre-wrap;">${escape(message)}</p>
        </div>
        <p>For urgent matters, call us at <a href="tel:+254725409996">${BRAND.contactPhone}</a>.</p>
        <p>Warm regards,<br/>The ${BRAND.name} Team</p>
      `,
    });

    try {
      await client.send({
        from: `${BRAND.name} <${gmailUser}>`,
        to: email,
        subject: `We received your message — ${BRAND.name}`,
        content: "Message received",
        html: userHtml,
      });
      await logEmail({ recipient: email, subject: `We received your message — ${BRAND.name}`, template: "contact-ack", status: "sent", related_id: message_id });
    } catch (err: any) {
      await logEmail({ recipient: email, subject: `We received your message — ${BRAND.name}`, template: "contact-ack", status: "failed", error: String(err?.message || err), related_id: message_id });
    }

    await client.close();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("send-contact-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
