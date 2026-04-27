import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Quote, MessageSquarePlus } from "lucide-react";
import { z } from "zod";

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  message: string;
  avatar_initial: string | null;
}

const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  location: z.string().trim().max(80).optional(),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(15, "Tell us a bit more (15+ chars)").max(900),
});

const Stars = ({ value }: { value: number }) => (
  <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < value ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const Testimonials = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select("id,name,location,rating,message,avatar_initial")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(12);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      location: String(form.get("location") || ""),
      message: String(form.get("message") || ""),
      rating,
    };
    const parsed = testimonialSchema.safeParse(payload);
    if (!parsed.success) {
      toast({
        title: "Please check your entry",
        description: parsed.error.issues[0]?.message || "Invalid input",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("testimonials").insert({
      name: parsed.data.name,
      location: parsed.data.location || null,
      message: parsed.data.message,
      rating: parsed.data.rating,
      avatar_initial: parsed.data.name.trim().charAt(0).toUpperCase(),
      approved: false,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Thank you! 🌊",
      description: "Your testimonial was submitted and will appear after approval.",
    });
    setOpen(false);
    setRating(5);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Guests</h2>
          <p className="text-lg text-muted-foreground">
            Real reviews from real Kenyans who stayed with Nyali Shore Real Estate.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading testimonials…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground">No testimonials yet — be the first!</p>
        ) : (
          <div className="perspective-1000 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {items.map((t) => (
              <Card
                key={t.id}
                className="testimonial-3d border-border/60 shadow-property bg-card relative"
              >
                <CardContent className="p-7">
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/15" />
                  <Stars value={t.rating} />
                  <p className="mt-4 text-foreground/90 leading-relaxed italic">
                    "{t.message}"
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full ocean-gradient text-white font-bold flex items-center justify-center text-lg shadow-coastal">
                      {t.avatar_initial || t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{t.name}</p>
                      {t.location && (
                        <p className="text-xs text-muted-foreground">{t.location}, Kenya</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="ocean-gradient">
                <MessageSquarePlus className="mr-2 h-5 w-5" />
                Share Your Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tell us about your stay</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="t-name">Your Name *</Label>
                  <Input id="t-name" name="name" required maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-location">Where you're from</Label>
                  <Input id="t-location" name="location" placeholder="e.g. Nairobi" maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="p-1"
                        aria-label={`Rate ${n} stars`}
                      >
                        <Star
                          className={`h-7 w-7 transition ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-message">Your Experience *</Label>
                  <Textarea id="t-message" name="message" rows={5} required maxLength={900} placeholder="Share what made your stay special…" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full ocean-gradient">
                  {submitting ? "Submitting…" : "Submit Testimonial"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Submissions appear after admin approval.
                </p>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
