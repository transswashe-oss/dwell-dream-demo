import { CheckCircle2, Circle, Clock, FileText, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";

interface BookingTimelineProps {
  createdAt: string;
  updatedAt?: string;
  paymentStatus: string;
  hasInvoice?: boolean;
}

const BookingTimeline = ({ createdAt, updatedAt, paymentStatus, hasInvoice }: BookingTimelineProps) => {
  const isPaid = paymentStatus === "paid";
  const isPending = paymentStatus === "pending";
  const isFailed = paymentStatus === "failed" || paymentStatus === "cancelled";

  const steps = [
    {
      icon: Calendar,
      label: "Booking created",
      time: createdAt,
      done: true,
    },
    {
      icon: CreditCard,
      label: isPaid
        ? "Payment received"
        : isFailed
        ? "Payment failed"
        : "Payment pending (M-Pesa)",
      time: isPaid && updatedAt ? updatedAt : undefined,
      done: isPaid,
      failed: isFailed,
    },
    {
      icon: FileText,
      label: hasInvoice ? "Invoice PDF generated" : "Invoice will be available after payment",
      time: hasInvoice && updatedAt ? updatedAt : undefined,
      done: !!hasInvoice,
    },
  ];

  return (
    <div className="mt-4 p-4 rounded-lg border bg-muted/40">
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Status Timeline</p>
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.done ? CheckCircle2 : s.failed ? Circle : Clock;
          const colorClass = s.done
            ? "text-green-600"
            : s.failed
            ? "text-destructive"
            : "text-muted-foreground";
          return (
            <li key={i} className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${s.failed ? "text-destructive" : ""}`}>{s.label}</p>
                {s.time && (
                  <p className="text-xs text-muted-foreground">{format(new Date(s.time), "PPp")}</p>
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
