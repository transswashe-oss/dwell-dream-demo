import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-mombasa.jpg";

const Hero = () => {
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
              Dream Home
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto">
            Discover exceptional properties in the most desirable locations. Your dream home awaits.
          </p>
          
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-property max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="City, State, or ZIP"
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Property Type</label>
                <Select>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Price Range</label>
                <Select>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-300k">$0 - $300,000</SelectItem>
                    <SelectItem value="300k-600k">$300,000 - $600,000</SelectItem>
                    <SelectItem value="600k-1m">$600,000 - $1,000,000</SelectItem>
                    <SelectItem value="1m+">$1,000,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Search className="mr-2 h-5 w-5" />
                Search Homes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;