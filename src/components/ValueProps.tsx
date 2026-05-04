import { Card, CardContent } from "@/components/ui/card";
import { Waves, KeyRound, Headphones, Camera, BadgeCheck, Wallet } from "lucide-react";

const features = [
  { icon: Waves, title: "Short Stays (Per Night)", desc: "Airbnb-style getaways from KSh 3,500/night — book a weekend by the ocean." },
  { icon: KeyRound, title: "Long-Term Rentals (Per Month)", desc: "Furnished and unfurnished rentals from KSh 65,000/month for relocations and long stays." },
  { icon: BadgeCheck, title: "Verified Listings", desc: "Each property is personally inspected by our local Mombasa team." },
  { icon: Wallet, title: "M-Pesa STK Push", desc: "Pay securely with one PIN — no till numbers, no friction." },
  { icon: Headphones, title: "24/7 Local Support", desc: "Real Mombasa-based hosts on call when you need them." },
  { icon: Camera, title: "Real Photos", desc: "What you see is what you get — no stock images, ever." },
];

const ValueProps = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Nyali Shore?</h2>
        <p className="text-lg text-muted-foreground">
          We're not a generic listing site. We're a small Mombasa team obsessed with making coastal stays effortless.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <Card key={f.title} className="border-border/60 hover:shadow-property-hover transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl ocean-gradient flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ValueProps;
