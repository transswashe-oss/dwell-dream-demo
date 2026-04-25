import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  clientEmail: string;
  clientName: string;
  apartmentName: string;
  apartmentLocation: string;
  checkInDate: string;
  checkInTime: string;
  nights: number;
  totalAmount: number;
  transactionCode: string;
}

const escape = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const r: BookingEmailRequest = await req.json();
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    const detailsTable = `
      <table width="100%" cellpadding="8" cellspacing="0" style="background:#F9FAFB;border-radius:8px;">
        <tr><td style="color:#6B7280;width:160px;">Client Name:</td><td style="font-weight:600;">${escape(r.clientName)}</td></tr>
        <tr><td style="color:#6B7280;">Client Email:</td><td>${escape(r.clientEmail)}</td></tr>
        <tr><td style="color:#6B7280;">Apartment:</td><td>${escape(r.apartmentName)}</td></tr>
        <tr><td style="color:#6B7280;">Location:</td><td>${escape(r.apartmentLocation)}</td></tr>
        <tr><td style="color:#6B7280;">Check-in Date:</td><td>${escape(r.checkInDate)}</td></tr>
        <tr><td style="color:#6B7280;">Check-in Time:</td><td>${escape(r.checkInTime)}</td></tr>
        <tr><td style="color:#6B7280;">Nights:</td><td>${r.nights}</td></tr>
        <tr><td style="color:#6B7280;">Total Amount:</td><td style="color:#0891B2;font-weight:bold;">KSh ${r.totalAmount.toLocaleString()}</td></tr>
        <tr><td style="color:#6B7280;">Transaction Code:</td><td><strong>${escape(r.transactionCode)}</strong></td></tr>
      </table>`;

    // Admin email
    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: BRAND.adminEmail,
      replyTo: r.clientEmail,
      subject: `New Booking: ${r.apartmentName} — ${r.clientName}`,
      content: "New booking received",
      html: emailLayout({
        title: "🛎️ New Booking Received",
        bannerColor: "#F59E0B",
        bodyHtml: `<p>A new booking was placed and is awaiting your approval:</p>${detailsTable}<p style="margin-top:20px;">Please verify the M-Pesa payment and approve/reject the booking in the admin panel.</p>`,
      }),
    });

    // Client email
    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: r.clientEmail,
      subject: `Booking Confirmation — ${r.apartmentName}`,
      content: "Booking confirmation",
      html: emailLayout({
        title: "Booking Received — Pending Review ⏳",
        bodyHtml: `
          <p>Dear ${escape(r.clientName)},</p>
          <p>Thank you for booking with <strong>${BRAND.name}</strong>! Your booking details are below:</p>
          ${detailsTable}
          <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:14px;margin-top:20px;border-radius:4px;">
            <p style="margin:0;color:#92400E;"><strong>Status:</strong> Pending — Your payment is being verified.</p>
          </div>
          <p style="margin-top:16px;">You'll receive another email as soon as your booking is approved with directions and check-in instructions.</p>
          <p>Thank you for choosing ${BRAND.name}!</p>
        `,
      }),
    });

    await client.close();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error sending booking email:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
