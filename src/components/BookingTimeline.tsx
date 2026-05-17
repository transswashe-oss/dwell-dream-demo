import { CheckCircle2, Circle, Clock, FileText, CreditCard, Calendar, XCircle } from "lucide-react";
import { format } from "date-fns";

interface BookingTimelineProps {
  createdAt: string;
  updatedAt?: string;
  paymentStatus: string;
  invoiceGeneratedAt?: string | null;
}

const BookingTimeline = ({ createdAt, updatedAt, paymentStatus, invoiceGeneratedAt }: BookingTimelineProps) => {
  const isPaid = paymentStatus === "paid";
  const isPending = paymentStatus === "pending";
  const isFailed = paymentStatus === "failed" || paymentStatus === "cancelled";

  type Step = { icon: any; label: string; time?: string; done: boolean; failed?: boolean; pending?: boolean };

  const steps: Step[] = [
    {
      icon: Calendar,
      label: "Booking created",
      time: createdAt,
      done: true,
    },
    {
      icon: isFailed ? XCircle : CreditCard,
      label: isPaid
        ? "Payment received via M-Pesa"
        : isFailed
        ? `Payment ${paymentStatus}`
        : "Awaiting M-Pesa payment confirmation",
      time: (isPaid || isFailed) && updatedAt ? updatedAt : undefined,
      done: isPaid,
      failed: isFailed,
      pending: isPending,
    },
    {
      icon: FileText,
      label: invoiceGeneratedAt
        ? "Invoice PDF generated"
        : isPending
        ? "Provisional invoice available (pending payment)"
        : isPaid
        ? "Paid invoice ready to download"
        : "Invoice will be available after payment",
      time: invoiceGeneratedAt || undefined,
      done: !!invoiceGeneratedAt,
      pending: !invoiceGeneratedAt && (isPending || isPaid),
    },
  ];

  return (
    <div className="mt-4 p-4 rounded-lg border bg-muted/40">
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Status Timeline</p>
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.done ? CheckCircle2 : s.failed ? XCircle : s.pending ? Clock : Circle;
          const colorClass = s.done
            ? "text-green-600"
            : s.failed
            ? "text-destructive"
            : s.pending
            ? "text-amber-500 animate-pulse"
            : "text-muted-foreground";
          return (
            <li key={i} className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${s.failed ? "text-destructive" : ""}`}>{s.label}</p>
                {s.time ? (
                  <p className="text-xs text-muted-foreground">{format(new Date(s.time), "PPp")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">not generated yet</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default BookingTimeline;
