import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Bed, Bath, Square, Calendar, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  gallery_images?: string[];
  featured: boolean;
}

const ApartmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApartment(id);
    }
  }, [id]);

  const fetchApartment = async (apartmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('id', apartmentId)
        .single();

      if (error) throw error;
      setApartment(data);
    } catch (error) {
      console.error('Error fetching apartment:', error);
      toast({
        title: "Error",
        description: "Could not load apartment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !apartment) return;

    setBookingLoading(true);
    const formData = new FormData(e.currentTarget);
    const transactionCode = formData.get('transaction_code') as string;

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          apartment_id: apartment.id,
          transaction_code: transactionCode,
        });

      if (error) throw error;

      toast({
        title: "Booking Submitted!",
        description: "Your booking request has been submitted for admin approval.",
      });
      
      setShowBookingDialog(false);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Could not create booking",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
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
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          Loading apartment details...
        </div>
        <Footer />
      </div>
    );
  }

  if (!apartment) {
    return <Navigate to="/apartments" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            <div className="relative mb-4">
              {apartment.display_image ? (
                <img 
                  src={apartment.display_image}
                  alt={apartment.name}
                  className="w-full h-96 object-cover rounded-lg shadow-property"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-ocean rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-lg">No Image Available</span>
                </div>
              )}
              
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground">
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

            {/* Gallery */}
            {apartment.gallery_images && apartment.gallery_images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {apartment.gallery_images.slice(0, 3).map((image, index) => (
                  <img 
                    key={index}
                    src={image}
                    alt={`${apartment.name} gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <Card className="shadow-coastal">
              <CardContent className="p-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {apartment.name}
                </h1>
                
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{apartment.location}</span>
                </div>

                <div className="text-4xl font-bold text-primary mb-6">
                  {formatPrice(apartment.price, apartment.type)}
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                  <div className="text-center">
                    <Bed className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="font-semibold">{apartment.rooms}</div>
                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                  </div>
                  <div className="text-center">
                    <Bath className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="font-semibold">{apartment.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                  </div>
                  <div className="text-center">
                    <Square className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="font-semibold">{apartment.square_feet}</div>
                    <div className="text-sm text-muted-foreground">Sq Ft</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {apartment.description}
                  </p>
                </div>

                {/* Book Button */}
                {user ? (
                  <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full ocean-gradient">
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Book {apartment.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleBooking} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Property</Label>
                          <Input value={apartment.name} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input value={formatPrice(apartment.price, apartment.type)} disabled />
                        </div>
                        <div className="bg-accent/10 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payment Instructions
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Pay to Till Number: <strong>4097548</strong><br />
                            Name: <strong>OMAR WASHE KONDE</strong>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Complete the payment first, then enter your transaction code below
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transaction_code">Transaction Code *</Label>
                          <Input
                            id="transaction_code"
                            name="transaction_code"
                            required
                            placeholder="Enter M-Pesa transaction code"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowBookingDialog(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={bookingLoading}
                            className="flex-1"
                          >
                            {bookingLoading ? "Submitting..." : "Submit Booking"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-4">
                      Please sign in to book this property
                    </p>
                    <Button asChild>
                      <a href="/auth">Sign In</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ApartmentDetails;