import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-mombasa.jpg";

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
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-hero-gradient" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Find Your Perfect
            <span className="block bg-luxury-gradient bg-clip-text text-transparent">
              Airbnb in Mombasa
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto">
            Discover amazing short-stay apartments in the coastal city. Your dream vacation home awaits.
          </p>
          
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-property max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Nyali, Bamburi, Diani..."
                    className="pl-10 h-12"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Price Range (per night)</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="0-5000">KSh 0 - 5,000</SelectItem>
                    <SelectItem value="5000-10000">KSh 5,000 - 10,000</SelectItem>
                    <SelectItem value="10000-20000">KSh 10,000 - 20,000</SelectItem>
                    <SelectItem value="20000+">KSh 20,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSearch}>
                <Search className="mr-2 h-5 w-5" />
                Search Apartments
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;