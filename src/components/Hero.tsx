import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, ShieldCheck, Star, Sparkles } from "lucide-react";
import coastalImg from "@/assets/coastal-living.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (priceRange && priceRange !== "any") params.set("price", priceRange);
    navigate(`/apartments?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${coastalImg})` }}
      />
      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative z-10 container mx-auto px-4 text-center py-20">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full mb-6 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            Short stays & long-term rentals on the Mombasa coast
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Live the Coast.
            <span className="block bg-luxury-gradient bg-clip-text text-transparent">
              Stay or Rent on Nyali Shore.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Whether you're after a weekend getaway or a year-long home by the sea — we offer
            verified <strong>per-night Airbnb stays</strong> and <strong>per-month rentals</strong> across Nyali, Bamburi, Diani and beyond.
          </p>

          <div className="bg-background/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-property max-w-4xl mx-auto border border-white/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-muted-foreground">Where</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nyali, Bamburi, Diani…"
                    className="pl-10 h-12"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-muted-foreground">Price per night</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="0-5000">KSh 0 – 5,000</SelectItem>
                    <SelectItem value="5000-10000">KSh 5,000 – 10,000</SelectItem>
                    <SelectItem value="10000-20000">KSh 10,000 – 20,000</SelectItem>
                    <SelectItem value="20000+">KSh 20,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="lg" className="h-12 ocean-gradient" onClick={handleSearch}>
                <Search className="mr-2 h-5 w-5" />
                Search Apartments
              </Button>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Verified Hosts</div>
            <div className="flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> 4.9 Avg. Rating</div>
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Instant M-Pesa Booking</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
