import { useState, useEffect, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageLightbox from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Bed, Calendar as CalendarIcon, CreditCard, Clock, Moon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Apartment {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  monthly_price?: number;
  rooms: number;
  bathrooms?: number;
  square_feet?: number;
  description: string;
  display_image?: string;
  gallery_images?: string[];
  featured: boolean;
  google_maps_url?: string;
  unit_number?: string;
}

type BookingType = "per_night" | "monthly";

const ApartmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Booking form state
  const [bookingType, setBookingType] = useState<BookingType>("per_night");
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [nights, setNights] = useState(1);
  const [months, setMonths] = useState(1);

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

  const unitPrice = useMemo(() => {
    if (!apartment) return 0;
    return bookingType === "monthly" ? (apartment.monthly_price || 0) : apartment.price;
  }, [apartment, bookingType]);

  const duration = bookingType === "monthly" ? months : nights;

  const totalAmount = useMemo(() => unitPrice * duration, [unitPrice, duration]);

  const allImages = useMemo(() => {
    if (!apartment) return [];
    const images: string[] = [];
    if (apartment.display_image) images.push(apartment.display_image);
    if (apartment.gallery_images) images.push(...apartment.gallery_images);
    return images;
  }, [apartment]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !apartment || !checkInDate) return;

    setBookingLoading(true);
    const formData = new FormData(e.currentTarget);
    const transactionCode = formData.get('transaction_code') as string;

    try {
      const { data: inserted, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          apartment_id: apartment.id,
          transaction_code: transactionCode,
          check_in_date: format(checkInDate, 'yyyy-MM-dd'),
          check_in_time: checkInTime,
          nights: bookingType === 'per_night' ? nights : 1,
          months: bookingType === 'monthly' ? months : null,
          booking_type: bookingType,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notifications
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        await supabase.functions.invoke('send-booking-email', {
          body: {
            clientEmail: user.email,
            clientName: profile?.name || 'Guest',
            apartmentName: apartment.name,
            apartmentLocation: apartment.location,
            checkInDate: format(checkInDate, 'PPP'),
            checkInTime: checkInTime,
            nights: bookingType === 'per_night' ? nights : 0,
            months: bookingType === 'monthly' ? months : 0,
            bookingType,
            unitNumber: inserted?.assigned_unit_number || apartment.unit_number || '',
            totalAmount: totalAmount,
            transactionCode: transactionCode,
          },
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      // Auto-generate PDF receipt
      try {
        const { generateInvoicePDF } = await import('@/lib/invoice');
        await generateInvoicePDF({
          bookingId: inserted?.id || crypto.randomUUID(),
          clientName: (await supabase.from('profiles').select('name').eq('user_id', user.id).single()).data?.name || 'Guest',
          clientEmail: user.email || '',
          apartmentName: apartment.name,
          apartmentLocation: apartment.location,
          bookingType,
          checkInDate: format(checkInDate, 'PPP'),
          checkInTime,
          duration,
          unitPrice,
          totalAmount,
          transactionCode,
          status: 'Pending',
          unitNumber: inserted?.assigned_unit_number || apartment.unit_number,
          createdAt: new Date().toISOString(),
        });
      } catch (pdfErr) {
        console.error('PDF generation failed:', pdfErr);
      }

      toast({
        title: "Booking Submitted!",
        description: "Receipt downloaded. Check your email for confirmation.",
      });
      
      setShowBookingDialog(false);
      setCheckInDate(undefined);
      setNights(1);
      setMonths(1);
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

  const getGoogleMapsEmbed = (url: string) => {
    // Extract place ID or coordinates from Google Maps URL
    if (url.includes('place/')) {
      const placeMatch = url.match(/place\/([^/]+)/);
      if (placeMatch) {
        const placeName = placeMatch[1];
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(placeName)}`;
      }
    }
    if (url.includes('@')) {
      const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordsMatch) {
        return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${coordsMatch[1]},${coordsMatch[2]}&zoom=15`;
      }
    }
    return null;
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

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

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
                  className="w-full h-96 object-cover rounded-lg shadow-property cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(0)}
                />
              ) : (
                <div className="w-full h-96 bg-gradient-ocean rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-lg">No Image Available</span>
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

            {/* Gallery */}
            {apartment.gallery_images && apartment.gallery_images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {apartment.gallery_images.slice(0, 3).map((image, index) => (
                  <img 
                    key={index}
                    src={image}
                    alt={`${apartment.name} gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openLightbox(index + 1)}
                  />
                ))}
              </div>
            )}

            {/* Google Maps */}
            {apartment.google_maps_url && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </h3>
                <div className="rounded-lg overflow-hidden border">
                  {getGoogleMapsEmbed(apartment.google_maps_url) ? (
                    <iframe
                      src={getGoogleMapsEmbed(apartment.google_maps_url)!}
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="p-4 bg-muted">
                      <a 
                        href={apartment.google_maps_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <Card className="shadow-coastal">
              <CardContent className="p-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">{apartment.name}</h1>
                
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{apartment.location}</span>
                </div>

                <div className="text-4xl font-bold text-primary mb-6">
                  KSh {apartment.price.toLocaleString()}/night
                </div>

                {/* Property Details */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <span className="font-medium">{apartment.rooms} Bedrooms</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{apartment.description}</p>
                </div>

                {/* Book Button */}
                {user ? (
                  <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full ocean-gradient">
                        <CalendarIcon className="h-5 w-5 mr-2" />
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
                          <Label>Check-in Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !checkInDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={checkInDate}
                                onSelect={setCheckInDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Check-in Time *</Label>
                          <Select value={checkInTime} onValueChange={setCheckInTime}>
                            <SelectTrigger>
                              <Clock className="mr-2 h-4 w-4" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Number of Nights *</Label>
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="1"
                              value={nights}
                              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="bg-secondary/50 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span>KSh {apartment.price.toLocaleString()} x {nights} night{nights > 1 ? 's' : ''}</span>
                            <span>KSh {totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total Amount</span>
                            <span className="text-primary">KSh {totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-accent/10 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payment Instructions
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Pay to Till Number: <strong>4097548</strong><br />
                            Name: <strong>OMAR WASHE KONDE</strong><br />
                            Amount: <strong>KSh {totalAmount.toLocaleString()}</strong>
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
                            disabled={bookingLoading || !checkInDate}
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
                    <p className="text-muted-foreground mb-4">Please sign in to book this property</p>
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

      <ImageLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      <Footer />
    </div>
  );
};

export default ApartmentDetails;