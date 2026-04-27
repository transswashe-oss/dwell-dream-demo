import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Trash2, Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  message: string;
  approved: boolean;
  created_at: string;
}

const TestimonialsManagement = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("approved", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from("testimonials").update({ approved: true }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Approved" }); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); load(); }
  };

  if (loading) return <div className="text-center py-12">Loading…</div>;

  const pending = items.filter((i) => !i.approved);
  const approved = items.filter((i) => i.approved);

  const Row = ({ t }: { t: Testimonial }) => (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-medium">
            {t.name}{" "}
            {t.location && <span className="text-muted-foreground text-sm">— {t.location}</span>}
          </p>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {!t.approved && (
            <Button size="sm" variant="outline" onClick={() => approve(t.id)} className="text-green-600">
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => remove(t.id)} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-foreground/80 italic">"{t.message}"</p>
      <p className="text-xs text-muted-foreground mt-2">
        Submitted {new Date(t.created_at).toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>
            Pending Approval <Badge variant="secondary" className="ml-2">{pending.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? <p className="text-muted-foreground">No pending testimonials.</p> :
            pending.map((t) => <Row key={t.id} t={t} />)}
        </CardContent>
      </Card>
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>Approved <Badge className="ml-2">{approved.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approved.length === 0 ? <p className="text-muted-foreground">No approved testimonials yet.</p> :
            approved.map((t) => <Row key={t.id} t={t} />)}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestimonialsManagement;
