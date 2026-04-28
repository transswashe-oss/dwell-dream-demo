import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Bed, Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Apartment {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  rooms: number;
  description: string;
  display_image?: string;
  featured: boolean;
}

const Apartments = () => {
  const [searchParams] = useSearchParams();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search filters
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "");
  const [rooms, setRooms] = useState("");

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [apartments, location, priceRange, rooms]);

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApartments(data || []);
      setFilteredApartments(data || []);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = apartments;

    // Location filter
    if (location) {
      filtered = filtered.filter(apt => 
        apt.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange && priceRange !== "any") {
      const [min, max] = priceRange.split('-').map(p => parseInt(p.replace('+', '')));
      filtered = filtered.filter(apt => {
        if (priceRange.includes('+')) {
          return apt.price >= min;
        }
        return apt.price >= min && apt.price <= max;
      });
    }

    // Rooms filter
    if (rooms && rooms !== "any") {
      filtered = filtered.filter(apt => apt.rooms === parseInt(rooms));
    }

    setFilteredApartments(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const clearFilters = () => {
    setLocation("");
    setPriceRange("");
    setRooms("");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Loading apartments...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 ocean-gradient">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Find Your Perfect Stay or Rental
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Short-term Airbnb stays and long-term monthly rentals across Mombasa
          </p>
          
          {/* Search Form */}
          <Card className="shadow-coastal bg-card/95 backdrop-blur-sm max-w-4xl mx-auto">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Nyali, Bamburi..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Price Range (per night)</Label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
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

                  <div>
                    <Label>Bedrooms</Label>
                    <Select value={rooms} onValueChange={setRooms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1 Bedroom</SelectItem>
                        <SelectItem value="2">2 Bedrooms</SelectItem>
                        <SelectItem value="3">3 Bedrooms</SelectItem>
                        <SelectItem value="4">4+ Bedrooms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button type="submit" className="flex-1 ocean-gradient">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              {filteredApartments.length} Apartment{filteredApartments.length !== 1 ? 's' : ''} Found
            </h2>
          </div>

          {filteredApartments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No apartments match your search criteria.
              </p>
              <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredApartments.map((apartment) => (
                <Card key={apartment.id} className="group overflow-hidden shadow-property hover:shadow-property-hover transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative overflow-hidden h-64">
                    {apartment.display_image ? (
                      <img 
                        src={apartment.display_image}
                        alt={apartment.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
                        <span className="text-white font-medium">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-primary-foreground">Airbnb</Badge>
                    </div>
                    {apartment.featured && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {apartment.name}
                      </h3>
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{apartment.location}</span>
                      </div>
                      <p className="text-2xl font-bold text-primary mb-4">
                        KSh {apartment.price.toLocaleString()}/night
                      </p>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-6">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{apartment.rooms} bed{apartment.rooms > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <Link to={`/apartments/${apartment.id}`}>
                      <Button className="w-full ocean-gradient">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Apartments;