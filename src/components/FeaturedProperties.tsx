import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Eye, ArrowRight } from "lucide-react";
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
  display_image?: string;
}

const FeaturedProperties = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedApartments();
  }, []);

  const fetchFeaturedApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('featured', true)
        .limit(6);

      if (error) throw error;
      setApartments(data || []);
    } catch (error) {
      console.error('Error fetching featured apartments:', error);
    } finally {
      setLoading(false);
    }
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
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <div className="text-muted-foreground">Loading featured properties...</div>
        </div>
      </section>
    );
  }

  if (apartments.length === 0) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Featured Properties
          </h2>
          <p className="text-muted-foreground mb-8">
            No featured properties available at the moment. Check back soon!
          </p>
          <Link to="/apartments">
            <Button size="lg">
              View All Properties
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Featured Properties
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our hand-picked selection of premium properties in the most sought-after locations in Mombasa.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {apartments.map((apartment) => (
            <Card key={apartment.id} className="group overflow-hidden card-3d shadow-property hover:shadow-property-hover transition-all duration-300">
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
                  <Badge className="bg-primary text-primary-foreground">
                    {apartment.type === 'Buy' ? 'For Sale' : 
                     apartment.type === 'Rent' ? 'For Rent' : 'Airbnb'}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                </div>
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
        
        <div className="text-center">
          <Link to="/apartments">
            <Button size="lg" variant="outline" className="group">
              View All Properties
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
