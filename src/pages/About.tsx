import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, MessageCircle, Award, Users, Heart, ShieldCheck, Compass, Waves } from "lucide-react";
import coastalImg from "@/assets/coastal-living.jpg";

const About = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/254725409996", "_blank");
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero with the coastal image */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coastalImg})` }}
        />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative z-10 container mx-auto px-4 text-center py-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight">
            Coastal Living, Reimagined.
          </h1>
          <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Nyali Shore Real Estate is a boutique Mombasa-based team curating premium short-stay
            apartments along Kenya's most beautiful coastline.
          </p>
        </div>
      </section>

      {/* Our story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">Our Story</h2>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                Born along the Nyali shoreline, we noticed travelers struggling to find honest,
                verified short-stay apartments in Mombasa. Photos didn't match. Bookings fell
                through. Hosts vanished.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We built Nyali Shore Real Estate to fix that — every apartment is personally
                inspected, every host is verified, and every booking is backed by a real
                Mombasa-based team that picks up the phone.
              </p>
            </div>
            <Card className="shadow-coastal overflow-hidden">
              <img src={coastalImg} alt="Coastal living room" className="w-full h-72 object-cover" />
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">What we promise</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><div className="w-2 h-2 bg-primary rounded-full mr-3" />Verified properties — no surprises</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-primary rounded-full mr-3" />Transparent M-Pesa pricing</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-primary rounded-full mr-3" />24/7 local support</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-primary rounded-full mr-3" />Same-day booking confirmation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground">Built on three coastal principles.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "Honesty", desc: "What you see online is exactly what you get on arrival." },
              { icon: Compass, title: "Local Expertise", desc: "We live in Mombasa. We know the neighborhoods and the tides." },
              { icon: Waves, title: "Hospitality", desc: "Every guest is treated like family — because the coast is small." },
            ].map((v) => (
              <Card key={v.title} className="text-center shadow-warm">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-full ocean-gradient flex items-center justify-center mx-auto mb-4">
                    <v.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{v.title}</h3>
                  <p className="text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 ocean-gradient text-white">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: "500+", l: "Happy Guests" },
            { n: "50+", l: "Verified Apartments" },
            { n: "4.9★", l: "Average Rating" },
            { n: "24/7", l: "Support" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-4xl md:text-5xl font-bold mb-1">{s.n}</div>
              <div className="text-sm md:text-base opacity-90">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center shadow-warm">
              <CardContent className="p-8">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
                <p className="text-muted-foreground">Nyali, Mombasa<br />Kenya</p>
              </CardContent>
            </Card>
            <Card className="text-center shadow-warm">
              <CardContent className="p-8">
                <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Call Us</h3>
                <p className="text-muted-foreground mb-4">+254 725 409 996</p>
                <Button onClick={handleWhatsApp} variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center shadow-warm">
              <CardContent className="p-8">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email Us</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:omaryw003@gmail.com" className="hover:text-primary">
                    omaryw003@gmail.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
