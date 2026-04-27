import { Search, Calendar, CreditCard, Home } from "lucide-react";

const steps = [
  { icon: Search, title: "Discover", desc: "Browse curated apartments across Nyali, Bamburi, and Diani." },
  { icon: Calendar, title: "Pick Dates", desc: "Choose your check-in and number of nights." },
  { icon: CreditCard, title: "Pay via M-Pesa", desc: "Send the total to Till 4097548 and submit the code." },
  { icon: Home, title: "Check In", desc: "We approve, send directions, and welcome you to the coast." },
];

const HowItWorks = () => (
  <section className="py-20 bg-secondary/40">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
        <p className="text-lg text-muted-foreground">From browsing to check-in in under 10 minutes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <div key={s.title} className="relative bg-card rounded-2xl p-6 shadow-property text-center">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full ocean-gradient text-white text-sm font-bold flex items-center justify-center shadow-coastal">
              {i + 1}
            </div>
            <s.icon className="h-10 w-10 mx-auto text-primary mb-3 mt-2" />
            <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
