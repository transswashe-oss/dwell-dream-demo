import { jsPDF } from "jspdf";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  apartmentName: string;
  apartmentLocation: string;
  bookingType: "per_night" | "monthly";
  checkInDate: string;
  checkInTime?: string;
  duration: number;
  unitPrice: number;
  subtotalAmount?: number;
  discountCode?: string | null;
  discountAmount?: number;
  totalAmount: number;
  transactionCode: string;
  status: string;
  unitNumber?: string;
  createdAt: string;
}

interface SiteSettings {
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  footer_text?: string;
}

async function loadSiteSettings(): Promise<SiteSettings> {
  try {
    const { data } = await supabase.from("site_settings").select("contact_email, contact_phone, contact_address, footer_text").eq("id", 1).maybeSingle();
    return data || {};
  } catch {
    return {};
  }
}

export async function generateInvoicePDF(data: InvoiceData, action: "save" | "open" = "save") {
  const settings = await loadSiteSettings();
  const email = settings.contact_email || "omaryw003@gmail.com";
  const phone = settings.contact_phone || "+254 725 409 996";
  const address = settings.contact_address || "Nyali, Mombasa, Kenya";
  const footerText = settings.footer_text || "Thank you for choosing Nyali Shore Real Estate.";

  const subtotal = data.subtotalAmount ?? (data.unitPrice * data.duration);
  const discount = data.discountAmount ?? 0;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header band
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, W, 36, "F");

  try {
    const img = await fetch(logo).then((r) => r.blob()).then(blobToDataUrl);
    doc.addImage(img, "PNG", 12, 6, 24, 24);
  } catch { /* ignore */ }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Nyali Shore Real Estate", 42, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(address, 42, 20);
  doc.text(`${phone}  •  ${email}`, 42, 25);
  doc.text("https://nyalishorerealestate.netlify.app", 42, 30);

  // Title
  y = 48;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.bookingType === "monthly" ? "RENTAL RECEIPT" : "BOOKING RECEIPT", 12, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt #: ${data.bookingId.slice(0, 8).toUpperCase()}`, W - 12, y - 6, { align: "right" });
  doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, W - 12, y, { align: "right" });
  doc.text(`Status: ${data.status}`, W - 12, y + 5, { align: "right" });

  y += 10;
  doc.setDrawColor(220);
  doc.line(12, y, W - 12, y);

  // Client + property
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed To", 12, y);
  doc.text("Property", W / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 6;
  doc.text(data.clientName, 12, y);
  doc.text(data.apartmentName, W / 2, y);
  y += 5;
  doc.text(data.clientEmail, 12, y);
  doc.text(data.apartmentLocation, W / 2, y);

  if (data.unitNumber) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`Unit #: ${data.unitNumber}`, W / 2, y);
    doc.setFont("helvetica", "normal");
  }

  // Booking details
  y += 12;
  doc.setFillColor(241, 245, 249);
  doc.rect(12, y - 6, W - 24, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Booking Details", 16, y);
  doc.setFont("helvetica", "normal");
  y += 7;
  const isMonthly = data.bookingType === "monthly";
  const rows: [string, string][] = [
    ["Booking Type:", isMonthly ? "Monthly Rental" : "Per Night (Short Stay)"],
    [isMonthly ? "Start Date:" : "Check-in Date:", data.checkInDate + (data.checkInTime ? ` at ${data.checkInTime}` : "")],
    [isMonthly ? "Duration:" : "Nights:", `${data.duration} ${isMonthly ? "month(s)" : "night(s)"}`],
    ["Transaction Code:", data.transactionCode || "—"],
  ];
  rows.forEach(([k, v]) => {
    doc.text(k, 16, y);
    doc.text(v, 70, y);
    y += 6;
  });

  // Totals
  y += 6;
  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(0.4);
  doc.line(12, y, W - 12, y);
  y += 8;
  const unitLabel = isMonthly ? "per month" : "per night";
  doc.setFontSize(10);
  doc.text(`KSh ${data.unitPrice.toLocaleString()} ${unitLabel} × ${data.duration}`, 12, y);
  doc.text(`KSh ${subtotal.toLocaleString()}`, W - 12, y, { align: "right" });

  if (discount > 0) {
    y += 6;
    doc.setTextColor(22, 163, 74);
    doc.text(`Discount${data.discountCode ? ` (${data.discountCode})` : ""}`, 12, y);
    doc.text(`− KSh ${discount.toLocaleString()}`, W - 12, y, { align: "right" });
    doc.setTextColor(20);
  }

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", 12, y);
  doc.setTextColor(8, 145, 178);
  doc.text(`KSh ${data.totalAmount.toLocaleString()}`, W - 12, y, { align: "right" });
  doc.setTextColor(20);

  // Footer (from site_settings)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  const splitFooter = doc.splitTextToSize(footerText, W - 24);
  doc.text(splitFooter, W / 2, 270, { align: "center" });
  doc.text(`${address}  •  ${phone}  •  ${email}`, W / 2, 282, { align: "center" });
  doc.text("Keep this receipt as proof of booking.", W / 2, 288, { align: "center" });

  const filename = `nyali-shore-receipt-${data.bookingId.slice(0, 8)}.pdf`;
  if (action === "open") doc.output("dataurlnewwindow");
  else doc.save(filename);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}
