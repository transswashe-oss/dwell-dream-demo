import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Bed, Bath, Square } from "lucide-react";
import { Property } from "@/data/properties";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const formatPrice = (price: number) => {
    if (property.status === 'for-rent') {
      return `$${price.toLocaleString()}/mo`;
    }
    return `$${price.toLocaleString()}`;
  };

  const getImageSrc = (imagePath: string) => {
    if (imagePath.includes('property-1')) return property1;
    if (imagePath.includes('property-2')) return property2;
    if (imagePath.includes('property-3')) return property3;
    return property1;
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-property hover:shadow-property-hover transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative overflow-hidden">
        <img 
          src={getImageSrc(property.image)}
          alt={property.title}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <Badge 
            variant={property.status === 'for-sale' ? 'default' : 'secondary'}
            className="bg-primary text-primary-foreground"
          >
            {property.status === 'for-sale' ? 'For Sale' : 'For Rent'}
          </Badge>
        </div>
        <Button 
          size="icon" 
          variant="secondary"
          className="absolute top-4 right-4 bg-background/80 hover:bg-background"
        >
          <Heart className="h-4 w-4" />
        </Button>
        {property.featured && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-accent text-accent-foreground">
              Featured
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.address}, {property.city}, {property.state}</span>
          </div>
          <p className="text-2xl font-bold text-primary mb-4">
            {formatPrice(property.price)}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button className="flex-1 bg-primary hover:bg-primary/90">
            View Details
          </Button>
          <Button variant="outline" className="flex-1">
            Schedule Tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;