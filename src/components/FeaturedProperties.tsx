import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { mockProperties } from "@/data/properties";
import { ArrowRight } from "lucide-react";

const FeaturedProperties = () => {
  const featuredProperties = mockProperties.filter(property => property.featured);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Featured Properties
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our hand-picked selection of premium properties in the most sought-after locations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" variant="outline" className="group">
            View All Properties
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;