import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchForm, { SearchFilters } from "@/components/SearchForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Apartment {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  rooms: number;
  bathrooms: number;
  square_feet: number;
  description: string;
  display_image?: string;
  featured: boolean;
}

const Apartments = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApartments();
  }, []);

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

  const handleSearch = (filters: SearchFilters) => {
    let filtered = apartments;

    if (filters.type) {
      filtered = filtered.filter(apt => apt.type === filters.type);
    }

    filtered = filtered.filter(apt => 
      apt.price >= filters.minPrice && 
      apt.price <= filters.maxPrice
    );

    setFilteredApartments(filtered);
  };

  const formatPrice = (price: number, type: string) => {
    if (type === 'Rent') {
      return `KSh ${price.toLocaleString()}/month`;
    } else if (type === 'Airbnb') {
      return `KSh ${price.toLocaleString()}/night`;
    }
    return `KSh ${price.toLocaleString()}`;
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
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 ocean-gradient">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Discover amazing properties in Mombasa for rent, short stays, or purchase
          </p>
          <SearchForm onSearch={handleSearch} />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              {filteredApartments.length} Properties Found
            </h2>
          </div>

          {filteredApartments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No apartments match your search criteria. Please try different filters.
              </p>
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
                      <Badge 
                        variant={apartment.type === 'Buy' ? 'default' : 'secondary'}
                        className="bg-primary text-primary-foreground"
                      >
                        {apartment.type === 'Buy' ? 'For Sale' : 
                         apartment.type === 'Rent' ? 'For Rent' : 'Airbnb'}
                      </Badge>
                    </div>
                    {apartment.featured && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-accent text-accent-foreground">
                          Featured
                        </Badge>
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
                        {formatPrice(apartment.price, apartment.type)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{apartment.rooms} beds</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        <span>{apartment.bathrooms} baths</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        <span>{apartment.square_feet} sqft</span>
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