import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentBooking {
  id: string;
  mpesa_checkout_id: string | null;
  mpesa_receipt: string | null;
  transaction_code: string | null;
  payment_status: string;
  total_amount: number | null;
  created_at: string;
  updated_at: string;
  apartments: { name: string } | null;
}

const PaymentsManagement = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, mpesa_checkout_id, mpesa_receipt, transaction_code, payment_status, total_amount, created_at, updated_at, apartments(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPayments((data || []) as PaymentBooking[]);
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not load payments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const paymentBadge = (status: string) => {
    const normalized = (status || "pending").toLowerCase();
    if (normalized === "paid") return <Badge>{status}</Badge>;
    if (normalized === "failed" || normalized === "cancelled") return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="secondary">{status || "pending"}</Badge>;
  };

  if (loading) return <div className="text-center py-8">Loading payments...</div>;

  return (
    <Card className="shadow-coastal">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payments</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchPayments}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-muted-foreground">No payment records yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Property</th>
                  <th className="py-3 pr-4 font-medium">mpesa_checkout_id</th>
                  <th className="py-3 pr-4 font-medium">mpesa_receipt</th>
                  <th className="py-3 pr-4 font-medium">transaction_code</th>
                  <th className="py-3 pr-4 font-medium">payment_status</th>
                  <th className="py-3 pr-4 font-medium">Amount</th>
                  <th className="py-3 pr-4 font-medium">Created</th>
                  <th className="py-3 pr-4 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium whitespace-nowrap">{payment.apartments?.name || "Booking"}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{payment.mpesa_checkout_id || "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{payment.mpesa_receipt || "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{payment.transaction_code || "—"}</td>
                    <td className="py-3 pr-4">{paymentBadge(payment.payment_status)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">KSh {(payment.total_amount || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{new Date(payment.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{new Date(payment.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentsManagement;