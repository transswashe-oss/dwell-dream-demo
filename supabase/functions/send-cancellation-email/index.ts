import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escape = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { clientName, clientEmail, apartmentName, bookingType, transactionCode, reason, bookingId } = await req.json();
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPassword) throw new Error("Gmail not configured");

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    const adminHtml = emailLayout({
      title: "🛑 Cancellation Request",
      bannerColor: "#EF4444",
      bodyHtml: `
        <p>A guest has requested to cancel a booking:</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#FEF2F2;border-radius:8px;">
          <tr><td style="color:#6B7280;width:160px;">Guest:</td><td><strong>${escape(clientName)}</strong></td></tr>
          <tr><td style="color:#6B7280;">Email:</td><td>${escape(clientEmail)}</td></tr>
          <tr><td style="color:#6B7280;">Property:</td><td>${escape(apartmentName)}</td></tr>
          <tr><td style="color:#6B7280;">Type:</td><td>${bookingType === 'monthly' ? 'Monthly Rental' : 'Short Stay'}</td></tr>
          <tr><td style="color:#6B7280;">Transaction:</td><td>${escape(transactionCode || '—')}</td></tr>
          <tr><td style="color:#6B7280;">Booking ID:</td><td>${escape(bookingId)}</td></tr>
          <tr><td style="color:#6B7280;vertical-align:top;">Reason:</td><td>${escape(reason || 'No reason provided')}</td></tr>
        </table>
        <p style="margin-top:16px;">Please review and respond to the guest. Status has been set to <strong>CancellationRequested</strong>.</p>
      `,
    });

    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: BRAND.adminEmail,
      replyTo: clientEmail,
      subject: `Cancellation Request — ${apartmentName} (${clientName})`,
      content: "Cancellation request",
      html: adminHtml,
    });

    // Acknowledge to client
    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: clientEmail,
      subject: `Cancellation request received — ${apartmentName}`,
      content: "Cancellation request received",
      html: emailLayout({
        title: "Cancellation Request Received",
        bannerColor: "#F59E0B",
        bodyHtml: `<p>Hi ${escape(clientName)},</p><p>We've received your request to cancel your booking for <strong>${escape(apartmentName)}</strong>. Our team will review and contact you within 24 hours.</p><p>Reference: ${escape(bookingId)}</p>`,
      }),
    });

    await client.close();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e: any) {
    console.error("cancel email error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
