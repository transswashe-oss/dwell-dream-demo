import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  apartmentName: string;
  apartmentLocation: string;
  apartmentImage: string;
  checkInDate: string;
  checkInTime: string;
  nights: number;
  totalAmount: number;
  transactionCode: string;
  status: 'Approved' | 'Rejected';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      clientPhone,
      apartmentName,
      apartmentLocation,
      apartmentImage,
      checkInDate,
      checkInTime,
      nights,
      totalAmount,
      transactionCode,
      status,
    }: StatusEmailRequest = await req.json();

    console.log("Sending status update email:", { clientEmail, apartmentName, status });

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

    const isApproved = status === 'Approved';
    const statusColor = isApproved ? '#10B981' : '#EF4444';
    const statusMessage = isApproved 
      ? 'Great news! Your booking has been approved. We look forward to hosting you!'
      : 'We regret to inform you that your booking could not be approved at this time. Please contact us for more information.';

    // Professional email template with apartment image
    const clientEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0891B2 0%, #164E63 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">StayMombasa</h1>
                    <p style="color: #E0F2FE; margin: 10px 0 0 0; font-size: 14px;">Your Coastal Getaway Awaits</p>
                  </td>
                </tr>
                
                <!-- Status Banner -->
                <tr>
                  <td style="background-color: ${statusColor}; padding: 15px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Booking ${status}</h2>
                  </td>
                </tr>
                
                <!-- Apartment Image -->
                ${apartmentImage ? `
                <tr>
                  <td style="padding: 0;">
                    <img src="${apartmentImage}" alt="${apartmentName}" style="width: 100%; height: 250px; object-fit: cover;" />
                  </td>
                </tr>
                ` : ''}
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Dear ${clientName},</p>
                    <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">${statusMessage}</p>
                    
                    <!-- Booking Details Card -->
                    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                      <h3 style="color: #111827; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #0891B2; padding-bottom: 10px;">Booking Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">Property:</td>
                          <td style="color: #111827; font-size: 14px; font-weight: 600; border-bottom: 1px solid #E5E7EB; text-align: right;">${apartmentName}</td>
                        </tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">Location:</td>
                          <td style="color: #111827; font-size: 14px; border-bottom: 1px solid #E5E7EB; text-align: right;">${apartmentLocation}</td>
                        </tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">Check-in Date:</td>
                          <td style="color: #111827; font-size: 14px; border-bottom: 1px solid #E5E7EB; text-align: right;">${checkInDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">Check-in Time:</td>
                          <td style="color: #111827; font-size: 14px; border-bottom: 1px solid #E5E7EB; text-align: right;">${checkInTime}</td>
                        </tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">Nights:</td>
                          <td style="color: #111827; font-size: 14px; border-bottom: 1px solid #E5E7EB; text-align: right;">${nights}</td>
                        </tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; border-bottom: 1px solid #E5E7EB;">Transaction Code:</td>
                          <td style="color: #111827; font-size: 14px; border-bottom: 1px solid #E5E7EB; text-align: right;">${transactionCode}</td>
                        </tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 14px; font-weight: bold;">Total Amount:</td>
                          <td style="color: #0891B2; font-size: 16px; font-weight: bold; text-align: right;">KSh ${totalAmount.toLocaleString()}</td>
                        </tr>
                      </table>
                    </div>
                    
                    ${isApproved ? `
                    <!-- Contact Info for Approved -->
                    <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin-bottom: 25px;">
                      <p style="color: #065F46; font-size: 14px; margin: 0;">
                        <strong>Next Steps:</strong> Please save this email for your records. We will contact you closer to your check-in date with additional details.
                      </p>
                    </div>
                    ` : `
                    <!-- Contact Info for Rejected -->
                    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 25px;">
                      <p style="color: #991B1B; font-size: 14px; margin: 0;">
                        <strong>Need Help?</strong> If you believe this was an error or need assistance, please contact us at transswashe@gmail.com
                      </p>
                    </div>
                    `}
                    
                    <p style="color: #6B7280; font-size: 14px; margin: 0;">Thank you for choosing StayMombasa!</p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1F2937; padding: 25px; text-align: center;">
                    <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 10px 0;">StayMombasa - Your Coastal Getaway</p>
                    <p style="color: #6B7280; font-size: 11px; margin: 0;">Mombasa, Kenya | transswashe@gmail.com</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email to client
    await client.send({
      from: gmailUser,
      to: clientEmail,
      subject: `Booking ${status} - ${apartmentName} | StayMombasa`,
      content: `Your booking for ${apartmentName} has been ${status.toLowerCase()}.`,
      html: clientEmailContent,
    });

    console.log("Client status email sent successfully");

    // Send notification to admin
    const adminEmailContent = `
      <h2>Booking Status Updated - StayMombasa</h2>
      <p>A booking has been <strong style="color: ${statusColor}">${status}</strong>:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${clientName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${clientEmail}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${clientPhone || 'Not provided'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Apartment:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${apartmentName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction Code:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transactionCode}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">${status}</td></tr>
      </table>
    `;

    await client.send({
      from: gmailUser,
      to: gmailUser,
      subject: `Booking ${status}: ${apartmentName} - ${clientName}`,
      content: `Booking ${status}`,
      html: adminEmailContent,
    });

    console.log("Admin notification email sent successfully");

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending status email:", error);
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
