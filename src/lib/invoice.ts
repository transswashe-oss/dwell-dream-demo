import { jsPDF } from "jspdf";
import logo from "@/assets/logo.png";

export interface InvoiceData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  apartmentName: string;
  apartmentLocation: string;
  bookingType: "per_night" | "monthly";
  checkInDate: string;
  checkInTime?: string;
  duration: number; // nights or months
  unitPrice: number;
  totalAmount: number;
  transactionCode: string;
  status: string;
  unitNumber?: string;
  createdAt: string;
}

export async function generateInvoicePDF(data: InvoiceData, action: "save" | "open" = "save") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header band
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, W, 34, "F");

  // Logo
  try {
    const img = await fetch(logo).then((r) => r.blob()).then(blobToDataUrl);
    doc.addImage(img, "PNG", 12, 6, 22, 22);
  } catch { /* ignore logo errors */ }

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Nyali Shore Real Estate", 40, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Coastal stays & rentals — Mombasa, Kenya", 40, 22);
  doc.text("+254 725 409 996  •  omaryw003@gmail.com", 40, 28);

  // Invoice title
  y = 46;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.bookingType === "monthly" ? "RENTAL RECEIPT" : "BOOKING RECEIPT", 12, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt #: ${data.bookingId.slice(0, 8).toUpperCase()}`, W - 12, y - 6, { align: "right" });
  doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, W - 12, y, { align: "right" });
  doc.text(`Status: ${data.status}`, W - 12, y + 6, { align: "right" });

  y += 12;
  doc.setDrawColor(220);
  doc.line(12, y, W - 12, y);

  // Client section
  y += 10;
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
  y += 14;
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
  y += 8;
  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(0.4);
  doc.line(12, y, W - 12, y);
  y += 8;
  const unitLabel = isMonthly ? "per month" : "per night";
  doc.setFontSize(10);
  doc.text(`KSh ${data.unitPrice.toLocaleString()} ${unitLabel} × ${data.duration}`, 12, y);
  doc.text(`KSh ${data.totalAmount.toLocaleString()}`, W - 12, y, { align: "right" });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", 12, y);
  doc.setTextColor(8, 145, 178);
  doc.text(`KSh ${data.totalAmount.toLocaleString()}`, W - 12, y, { align: "right" });
  doc.setTextColor(20);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Thank you for choosing Nyali Shore Real Estate. Keep this receipt as proof of booking.",
    W / 2,
    280,
    { align: "center" }
  );
  doc.text("https://nyalishorerealestate.netlify.app", W / 2, 286, { align: "center" });

  const filename = `nyali-shore-receipt-${data.bookingId.slice(0, 8)}.pdf`;
  if (action === "open") {
    doc.output("dataurlnewwindow");
  } else {
    doc.save(filename);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}
