import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SubscribeForm = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already subscribed", description: "This email is already on our list." });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Subscribed! 🎉",
          description: "You'll receive offers and discounts straight to your inbox.",
        });
        setEmail("");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not subscribe", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 ocean-gradient">
      <div className="container mx-auto px-4 text-center">
        <Mail className="h-12 w-12 text-white mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Get Exclusive Offers & Discounts
        </h2>
        <p className="text-white/90 mb-8 max-w-xl mx-auto">
          Subscribe to be the first to know about seasonal discounts, new listings, and Nyali shore special offers.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="bg-white text-foreground"
          />
          <Button type="submit" disabled={loading} variant="secondary" size="lg">
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default SubscribeForm;
