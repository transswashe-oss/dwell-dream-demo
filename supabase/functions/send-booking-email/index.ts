import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      apartmentName,
      apartmentLocation,
      checkInDate,
      checkInTime,
      nights,
      totalAmount,
      transactionCode,
    }: BookingEmailRequest = await req.json();

    console.log("Sending booking emails for:", { clientEmail, apartmentName, transactionCode });

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      throw new Error("Gmail credentials not configured");
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    // Email to admin
    const adminEmailContent = `
      <h2>New Booking Received - StayMombasa</h2>
      <p>A new booking has been placed:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${clientName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${clientEmail}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Apartment:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${apartmentName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${apartmentLocation}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-in Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInDate}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-in Time:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInTime}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nights:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${nights}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">KSh ${totalAmount.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction Code:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transactionCode}</td></tr>
      </table>
      <p style="margin-top: 20px;">Please verify the payment and approve/reject the booking in the admin panel.</p>
    `;

    await client.send({
      from: gmailUser,
      to: gmailUser,
      subject: `New Booking: ${apartmentName} - ${clientName}`,
      content: "New booking received",
      html: adminEmailContent,
    });

    console.log("Admin email sent successfully");

    // Email to client
    const clientEmailContent = `
      <h2>Booking Confirmation - StayMombasa</h2>
      <p>Dear ${clientName},</p>
      <p>Thank you for your booking! Here are your booking details:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Apartment:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${apartmentName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${apartmentLocation}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-in Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInDate}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-in Time:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkInTime}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nights:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${nights}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">KSh ${totalAmount.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction Code:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transactionCode}</td></tr>
      </table>
      <p style="margin-top: 20px;"><strong>Status:</strong> Pending - Your booking is being reviewed and payment verified.</p>
      <p>You will receive another email once your booking is approved.</p>
      <p>Thank you for choosing StayMombasa!</p>
    `;

    await client.send({
      from: gmailUser,
      to: clientEmail,
      subject: `Booking Confirmation - ${apartmentName}`,
      content: "Booking confirmation",
      html: clientEmailContent,
    });

    console.log("Client email sent successfully");

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
