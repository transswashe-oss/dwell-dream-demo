import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, RefreshCw, Download, Search } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() + 86400000 : null;
    return payments.filter(p => {
      if (statusFilter !== "all" && (p.payment_status || "pending").toLowerCase() !== statusFilter) return false;
      const ts = new Date(p.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (s) {
        const hay = `${p.mpesa_checkout_id || ""} ${p.transaction_code || ""} ${p.mpesa_receipt || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [payments, statusFilter, search, fromDate, toDate]);

  const exportCSV = () => {
    const headers = ["Property", "mpesa_checkout_id", "mpesa_receipt", "transaction_code", "payment_status", "amount_ksh", "created_at", "updated_at"];
    const escape = (v: string | number | null | undefined) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = filtered.map(p => [
      p.apartments?.name || "",
      p.mpesa_checkout_id || "",
      p.mpesa_receipt || "",
      p.transaction_code || "",
      p.payment_status,
      p.total_amount || 0,
      p.created_at,
      p.updated_at,
    ].map(escape).join(","));
    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paymentBadge = (status: string) => {
    const normalized = (status || "pending").toLowerCase();
    if (normalized === "paid") return <Badge>{status}</Badge>;
    if (normalized === "failed" || normalized === "cancelled") return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="secondary">{status || "pending"}</Badge>;
  };

  if (loading) return <div className="text-center py-8">Loading payments...</div>;

  return (
    <Card className="shadow-coastal">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payments</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPayments}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          <Button size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4 mb-6 p-4 rounded-lg bg-muted/40">
          <div className="space-y-1">
            <Label className="text-xs">Payment Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Search (checkout / transaction)</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ws_CO_… or T-code" />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No matching payments</p>
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
                {filtered.map((payment) => (
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
            <p className="text-xs text-muted-foreground mt-3">{filtered.length} of {payments.length} payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentsManagement;
