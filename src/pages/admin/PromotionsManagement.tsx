import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail, Trash2, Users } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  created_at: string;
}

interface Promotion {
  id: string;
  subject: string;
  body: string;
  sent: boolean;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

const PromotionsManagement = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: subs }, { data: proms }] = await Promise.all([
      supabase.from("subscribers").select("*").order("created_at", { ascending: false }),
      supabase.from("promotional_messages").select("*").order("created_at", { ascending: false }),
    ]);
    setSubscribers(subs ?? []);
    setPromotions(proms ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = subscribers.filter((s) => s.active).length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      // Save promo first
      const { data: promo, error: insertErr } = await supabase
        .from("promotional_messages")
        .insert({ subject: subject.trim(), body: body.trim() })
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Trigger send
      const { data, error } = await supabase.functions.invoke("send-promotional-email", {
        body: { promotionId: promo.id, subject: subject.trim(), body: body.trim() },
      });
      if (error) throw error;

      toast({
        title: "Campaign sent! 🚀",
        description: `Sent to ${data?.sent ?? 0} of ${data?.total ?? 0} subscribers.`,
      });
      setSubject("");
      setBody("");
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not send campaign", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("subscribers").update({ active: !active }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-coastal">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
              <p className="text-3xl font-bold">{subscribers.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="shadow-coastal">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
              <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            </div>
            <Mail className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card className="shadow-coastal">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Campaigns Sent</p>
              <p className="text-3xl font-bold">{promotions.filter((p) => p.sent).length}</p>
            </div>
            <Send className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Compose */}
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>📣 New Promotional Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="🎁 50% off your next coastal stay!"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Message Body * (HTML supported)</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Hi there,</p><p>Enjoy <strong>50% off</strong> all Nyali shore stays this month!</p>"
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Will be sent to all {activeCount} active subscribers using the Nyali Shore Real Estate branded email template.
              </p>
            </div>
            <Button type="submit" disabled={sending || activeCount === 0} className="ocean-gradient">
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending..." : `Send to ${activeCount} subscribers`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Past campaigns */}
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <p className="text-muted-foreground">No campaigns yet.</p>
          ) : (
            <div className="space-y-3">
              {promotions.map((p) => (
                <div key={p.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{p.subject}</h4>
                    <Badge variant={p.sent ? "default" : "secondary"}>
                      {p.sent ? `Sent to ${p.recipient_count}` : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.sent_at ? `Sent ${new Date(p.sent_at).toLocaleString()}` : `Created ${new Date(p.created_at).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribers */}
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>Subscribers ({subscribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-muted-foreground">No subscribers yet.</p>
          ) : (
            <div className="space-y-2">
              {subscribers.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{s.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={s.active ? "outline" : "secondary"}
                      onClick={() => toggleActive(s.id, s.active)}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSubscriber(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionsManagement;
