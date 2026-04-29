import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { BRAND, emailLayout } from "../_shared/email-brand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  apartmentName: string;
  apartmentLocation: string;
  apartmentImage?: string;
  apartmentDescription?: string;
  apartmentRooms?: number;
  apartmentBathrooms?: number | null;
  apartmentPrice?: number;
  apartmentGoogleMapsUrl?: string | null;
  checkInDate: string;
  checkInTime: string;
  nights: number;
  months?: number;
  bookingType?: 'per_night' | 'monthly';
  unitNumber?: string;
  totalAmount: number;
  transactionCode: string;
  status: 'Approved' | 'Rejected';
}

const escape = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const r: StatusEmailRequest = await req.json();
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");

    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
    });

    const isApproved = r.status === 'Approved';
    const bannerColor = isApproved ? '#10B981' : '#EF4444';
    const statusMessage = isApproved
      ? '🎉 Great news! Your booking has been approved. We look forward to hosting you on the Nyali shore!'
      : 'We regret to inform you that your booking could not be approved at this time. Please contact us for more information.';

    const apartmentImageHtml = isApproved && r.apartmentImage
      ? `<img src="${escape(r.apartmentImage)}" alt="${escape(r.apartmentName)}" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;margin-bottom:20px;" />`
      : '';

    const directionsHtml = isApproved && r.apartmentGoogleMapsUrl ? `
      <div style="background:#EFF6FF;border-radius:8px;padding:18px;margin:20px 0;text-align:center;">
        <h3 style="color:#1E40AF;font-size:17px;margin:0 0 8px;">📍 How to Find Us</h3>
        <p style="color:#374151;font-size:14px;margin:0 0 14px;">Click below to get turn-by-turn directions:</p>
        <a href="${escape(r.apartmentGoogleMapsUrl)}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0891B2 0%,#164E63 100%);color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:bold;">🗺️ Open in Google Maps</a>
      </div>` : '';

    const apartmentDetailsHtml = isApproved ? `
      <div style="background:#F0FDF4;border-radius:8px;padding:18px;margin:20px 0;">
        <h3 style="color:#166534;font-size:17px;margin:0 0 12px;border-bottom:2px solid #22C55E;padding-bottom:8px;">🏠 Your Accommodation</h3>
        <table width="100%" cellpadding="6" cellspacing="0">
          <tr><td style="color:#6B7280;">Property:</td><td style="font-weight:600;text-align:right;">${escape(r.apartmentName)}</td></tr>
          <tr><td style="color:#6B7280;">Location:</td><td style="text-align:right;">${escape(r.apartmentLocation)}</td></tr>
          ${r.apartmentRooms ? `<tr><td style="color:#6B7280;">Bedrooms:</td><td style="text-align:right;">${r.apartmentRooms}</td></tr>` : ''}
          ${r.apartmentBathrooms ? `<tr><td style="color:#6B7280;">Bathrooms:</td><td style="text-align:right;">${r.apartmentBathrooms}</td></tr>` : ''}
          ${r.apartmentPrice ? `<tr><td style="color:#6B7280;">Price/Night:</td><td style="color:#0891B2;font-weight:600;text-align:right;">KSh ${r.apartmentPrice.toLocaleString()}</td></tr>` : ''}
        </table>
        ${r.apartmentDescription ? `<p style="color:#374151;font-size:13px;line-height:1.6;margin:12px 0 0;border-top:1px solid #D1FAE5;padding-top:12px;">${escape(r.apartmentDescription)}</p>` : ''}
      </div>` : '';

    const checkInHtml = isApproved ? `
      <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:14px;margin:20px 0;border-radius:4px;">
        <h4 style="color:#92400E;font-size:15px;margin:0 0 8px;">📋 Check-in Instructions</h4>
        <ul style="color:#78350F;font-size:13px;margin:0;padding-left:18px;line-height:1.7;">
          <li>Arrive at <strong>${escape(r.checkInTime)}</strong> on <strong>${escape(r.checkInDate)}</strong></li>
          <li>Contact us at <a href="mailto:${BRAND.adminEmail}">${BRAND.adminEmail}</a> or ${BRAND.contactPhone} for early check-in</li>
          <li>Keep this confirmation for your reference</li>
          <li>Use the Google Maps link above for directions</li>
        </ul>
      </div>` : '';

    const bookingTable = `
      <div style="background:#F9FAFB;border-radius:8px;padding:18px;margin:0 0 20px;">
        <h3 style="color:#111827;font-size:17px;margin:0 0 12px;border-bottom:2px solid #0891B2;padding-bottom:8px;">📅 Booking Summary</h3>
        <table width="100%" cellpadding="6" cellspacing="0">
          <tr><td style="color:#6B7280;">Property:</td><td style="font-weight:600;text-align:right;">${escape(r.apartmentName)}</td></tr>
          <tr><td style="color:#6B7280;">Location:</td><td style="text-align:right;">${escape(r.apartmentLocation)}</td></tr>
          <tr><td style="color:#6B7280;">Check-in:</td><td style="text-align:right;">${escape(r.checkInDate)} at ${escape(r.checkInTime)}</td></tr>
          <tr><td style="color:#6B7280;">Nights:</td><td style="text-align:right;">${r.nights}</td></tr>
          <tr><td style="color:#6B7280;">Transaction:</td><td style="text-align:right;">${escape(r.transactionCode)}</td></tr>
          <tr><td style="color:#6B7280;font-weight:bold;">Total:</td><td style="color:#0891B2;font-weight:bold;text-align:right;">KSh ${r.totalAmount.toLocaleString()}</td></tr>
        </table>
      </div>`;

    const clientHtml = emailLayout({
      title: `Booking ${r.status} ${isApproved ? '✅' : '❌'}`,
      bannerColor,
      bodyHtml: `
        <p>Dear ${escape(r.clientName)},</p>
        <p>${statusMessage}</p>
        ${apartmentImageHtml}
        ${bookingTable}
        ${apartmentDetailsHtml}
        ${directionsHtml}
        ${checkInHtml}
        <p style="text-align:center;margin:24px 0;">
          <a href="${BRAND.siteUrl}/my-bookings" style="display:inline-block;background:#0891B2;background-image:linear-gradient(135deg,#0891B2 0%,#164E63 100%);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">View My Bookings →</a>
        </p>
        <div style="background:${isApproved ? '#ECFDF5' : '#FEF2F2'};border-left:4px solid ${isApproved ? '#10B981' : '#EF4444'};padding:14px;margin-top:20px;border-radius:4px;">
          <p style="margin:0;color:${isApproved ? '#065F46' : '#991B1B'};font-size:14px;">
            <strong>${isApproved ? 'Need anything?' : 'Need help?'}</strong> Contact us at <a href="mailto:${BRAND.adminEmail}" style="color:#0891B2;">${BRAND.adminEmail}</a> or ${BRAND.contactPhone}.
          </p>
        </div>
        <p style="margin-top:20px;">Thank you for choosing ${BRAND.name}!</p>
      `,
    });

    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: r.clientEmail,
      subject: `Booking ${r.status} — ${r.apartmentName} | ${BRAND.name}`,
      content: `Your booking for ${r.apartmentName} has been ${r.status.toLowerCase()}.`,
      html: clientHtml,
    });

    // Admin notification
    const adminHtml = emailLayout({
      title: `Booking ${r.status}`,
      bannerColor,
      bodyHtml: `
        <p>A booking has been <strong style="color:${bannerColor};">${r.status}</strong>:</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#F9FAFB;border-radius:8px;">
          <tr><td style="color:#6B7280;width:140px;">Client:</td><td style="font-weight:600;">${escape(r.clientName)}</td></tr>
          <tr><td style="color:#6B7280;">Email:</td><td>${escape(r.clientEmail)}</td></tr>
          <tr><td style="color:#6B7280;">Phone:</td><td>${escape(r.clientPhone || 'Not provided')}</td></tr>
          <tr><td style="color:#6B7280;">Apartment:</td><td>${escape(r.apartmentName)}</td></tr>
          <tr><td style="color:#6B7280;">Transaction:</td><td>${escape(r.transactionCode)}</td></tr>
          <tr><td style="color:#6B7280;">Status:</td><td style="color:${bannerColor};font-weight:bold;">${r.status}</td></tr>
        </table>
      `,
    });

    await client.send({
      from: `${BRAND.name} <${gmailUser}>`,
      to: BRAND.adminEmail,
      subject: `Booking ${r.status}: ${r.apartmentName} — ${r.clientName}`,
      content: `Booking ${r.status}`,
      html: adminHtml,
    });

    await client.close();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error sending status email:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
