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
import { MapPin, Bed, Calendar as CalendarIcon, Smartphone, Clock, Moon, ExternalLink, Tag, Check, X, Loader2 } from "lucide-react";
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
  max_occupancy?: number;
  available?: boolean;
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
  const [phone, setPhone] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ code: string; discountAmount: number; description?: string } | null>(null);
  const [discountChecking, setDiscountChecking] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"idle" | "prompt" | "waiting" | "paid" | "failed" | "timeout">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

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

  const subtotalAmount = useMemo(() => unitPrice * duration, [unitPrice, duration]);
  const totalAmount = useMemo(
    () => Math.max(0, subtotalAmount - (discountInfo?.discountAmount || 0)),
    [subtotalAmount, discountInfo]
  );

  // Reset discount when subtotal changes
  useEffect(() => {
    if (discountInfo && discountInfo.discountAmount > subtotalAmount) setDiscountInfo(null);
  }, [subtotalAmount, discountInfo]);

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-discount", {
        body: { code: discountCode.trim(), subtotal: subtotalAmount },
      });
      if (error) throw error;
      if (!data?.valid) {
        toast({ title: "Invalid code", description: data?.error || "Code not accepted", variant: "destructive" });
        setDiscountInfo(null);
        return;
      }
      setDiscountInfo({ code: data.code, discountAmount: data.discountAmount, description: data.description });
      toast({ title: "Discount applied!", description: `You saved KSh ${data.discountAmount.toLocaleString()}` });
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e, "Could not validate code"), variant: "destructive" });
    } finally {
      setDiscountChecking(false);
    }
  };

  const removeDiscount = () => { setDiscountInfo(null); setDiscountCode(""); };


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

  const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

  const paymentErrorMessage = (error: unknown) =>
    getErrorMessage(error, "We could not send the M-Pesa prompt. Confirm your phone number and try again.");

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollPaymentStatus = async (bookingId: string): Promise<"paid" | "failed" | "timeout"> => {
    const started = Date.now();
    const timeoutMs = 120_000;
    const delays = [2000, 3000, 5000, 8000, 13000, 21000, 30000];

    for (let attempt = 0; Date.now() - started < timeoutMs; attempt += 1) {
      await wait(delays[Math.min(attempt, delays.length - 1)]);
      try {
        const { data, error } = await supabase.functions.invoke("lipana-status", { body: { bookingId } });
        if (error) throw error;
        if (data?.payment_status === "paid") return "paid";
        if (data?.payment_status === "failed" || data?.payment_status === "cancelled") return "failed";
        setPaymentMessage(data?.message || "Still waiting for M-Pesa confirmation…");
      } catch {
        setPaymentMessage("Still checking your payment. Network delays can take a moment…");
      }
    }

    return "timeout";
  };

  const resetBookingForm = () => {
    setShowBookingDialog(false);
    setCheckInDate(undefined);
    setNights(1);
    setMonths(1);
    setPhone("");
    setPaymentStage("idle");
    setPaymentMessage("");
    setBookingStep(1);
    removeDiscount();
  };

  const goNextBookingStep = () => {
    if (bookingStep === 1) {
      if (!checkInDate) {
        toast({ title: "Choose a date", description: "Select your check-in or move-in date before continuing.", variant: "destructive" });
        return;
      }
      setBookingStep(2);
      return;
    }
    setBookingStep(3);
  };

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !apartment || !checkInDate) return;

    if (!phone.trim()) {
      toast({ title: "Phone number required", description: "Enter the M-Pesa phone number that will receive the STK push.", variant: "destructive" });
      setBookingStep(3);
      return;
    }

    if (bookingType === 'monthly') {
      if (!apartment.monthly_price || apartment.monthly_price <= 0) {
        toast({ title: 'Monthly rental unavailable', description: 'This property is not available for monthly rental. Pick per-night instead.', variant: 'destructive' });
        setBookingStep(1);
        return;
      }
      if (apartment.available === false) {
        toast({ title: 'Property unavailable', description: 'Sorry, this unit is currently unavailable for long-term rent.', variant: 'destructive' });
        setBookingStep(1);
        return;
      }
    }

    setBookingLoading(true);
    setPaymentStage("prompt");
    setPaymentMessage("Sending STK Push to your phone…");

    try {
      // 1. Create booking row first
      const { data: inserted, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          apartment_id: apartment.id,
          check_in_date: format(checkInDate, 'yyyy-MM-dd'),
          check_in_time: checkInTime,
          nights: bookingType === 'per_night' ? nights : 1,
          months: bookingType === 'monthly' ? months : null,
          booking_type: bookingType,
          subtotal_amount: subtotalAmount,
          discount_code: discountInfo?.code || null,
          discount_amount: discountInfo?.discountAmount || 0,
          total_amount: totalAmount,
          phone_number: phone,
        })
        .select()
        .single();

      if (error) throw error;
      const bookingId = inserted.id;

      // 2. Trigger STK push
      const { data: stk, error: stkErr } = await supabase.functions.invoke("lipana-stk-push", {
        body: { bookingId, phone, amount: totalAmount },
      });
      if (stkErr || stk?.success === false || stk?.error) throw new Error(stk?.message || paymentErrorMessage(stkErr));

      toast({ title: "Check your phone 📱", description: "Enter your M-Pesa PIN to complete the payment." });
      setPaymentStage("waiting");
      setPaymentMessage("Waiting for you to enter your M-Pesa PIN…");

      // 3. Poll for confirmation
      const result = await pollPaymentStatus(bookingId);
      if (result === "paid") setPaymentStage("paid");
      else if (result === "timeout") setPaymentStage("timeout");
      else setPaymentStage("failed");

      const { data: finalBooking } = await supabase
        .from("bookings")
        .select("payment_status, mpesa_receipt, transaction_code, assigned_unit_number")
        .eq("id", bookingId)
        .maybeSingle();
      const finalPaymentStatus = finalBooking?.payment_status || (result === "paid" ? "paid" : "pending");
      const finalTxn = finalBooking?.mpesa_receipt || finalBooking?.transaction_code || stk?.transactionId || stk?.checkoutId || "Pending M-Pesa confirmation";

      // 4. Send notification email + receipt regardless (admin reviews)
      try {
        const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).single();
        await supabase.functions.invoke('send-booking-email', {
          body: {
            clientEmail: user.email,
            clientName: profile?.name || 'Guest',
            apartmentName: apartment.name,
            apartmentLocation: apartment.location,
            checkInDate: format(checkInDate, 'PPP'),
            checkInTime,
            nights: bookingType === 'per_night' ? nights : 0,
            months: bookingType === 'monthly' ? months : 0,
            bookingType,
            unitNumber: inserted?.assigned_unit_number || apartment.unit_number || '',
            totalAmount,
            transactionCode: finalTxn,
          },
        });
      } catch (emailError) { console.error('Email error:', emailError); }

      if (finalPaymentStatus === "paid" || finalPaymentStatus === "pending") {
        try {
          const { generateInvoicePDF } = await import('@/lib/invoice');
          const profileRes = await supabase.from('profiles').select('name').eq('user_id', user.id).single();
          await generateInvoicePDF({
            bookingId,
            clientName: profileRes.data?.name || 'Guest',
            clientEmail: user.email || '',
            apartmentName: apartment.name,
            apartmentLocation: apartment.location,
            bookingType,
            checkInDate: format(checkInDate, 'PPP'),
            checkInTime,
            duration,
            unitPrice,
            subtotalAmount,
            discountCode: discountInfo?.code,
            discountAmount: discountInfo?.discountAmount || 0,
            totalAmount,
            transactionCode: finalTxn,
            status: finalPaymentStatus === "paid" ? "Paid" : "Pending / Unpaid",
            unitNumber: finalBooking?.assigned_unit_number || inserted?.assigned_unit_number || apartment.unit_number,
            createdAt: new Date().toISOString(),
          });
        } catch (pdfErr) { console.error('PDF generation failed:', pdfErr); }
      }

      if (result === "paid") {
        toast({ title: "Payment received ✅", description: "Receipt downloaded. Admin will confirm shortly." });
      } else if (result === "failed") {
        toast({ title: "Payment not completed", description: "Your booking is saved as Pending. You can retry payment from My Bookings.", variant: "destructive" });
      } else {
        toast({ title: "Payment still pending", description: "M-Pesa confirmation is taking longer than usual. Your booking is saved as Pending and the invoice downloaded." });
      }

      resetBookingForm();
    } catch (error: unknown) {
      console.error('Booking error:', error);
      setPaymentStage("failed");
      const message = getErrorMessage(error, "Could not complete booking");
      setPaymentMessage(message);
      toast({
        title: "Payment prompt not sent",
        description: message,
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
    <div className="min-h-screen page-bg">
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

                <div className="mb-6 space-y-1">
                  <div className="text-4xl font-bold text-primary">
                    KSh {apartment.price.toLocaleString()}<span className="text-lg font-normal text-muted-foreground">/night</span>
                  </div>
                  {apartment.monthly_price && apartment.monthly_price > 0 && (
                    <div className="text-2xl font-semibold text-accent">
                      KSh {apartment.monthly_price.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/month (rental)</span>
                    </div>
                  )}
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
                        <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                          {["Stay", "Review", "Pay"].map((label, index) => {
                            const active = bookingStep === index + 1;
                            return (
                              <div key={label} className={`rounded-md border px-2 py-2 text-center ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                                {index + 1}. {label}
                              </div>
                            );
                          })}
                        </div>

                        <div className={bookingStep === 1 ? "space-y-4" : "hidden"}>
                        <div className="space-y-2">
                          <Label>Property</Label>
                          <Input value={apartment.name} disabled />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Booking Type *</Label>
                          <Select value={bookingType} onValueChange={(v) => setBookingType(v as BookingType)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_night">Per Night (Short Stay)</SelectItem>
                              <SelectItem
                                value="monthly"
                                disabled={!apartment.monthly_price || apartment.monthly_price <= 0 || apartment.available === false}
                              >
                                Per Month (Rental){(!apartment.monthly_price || apartment.monthly_price <= 0) ? " — unavailable" : (apartment.available === false ? " — currently unavailable" : "")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {apartment.max_occupancy ? (
                            <p className="text-xs text-muted-foreground">Max occupancy: {apartment.max_occupancy} guests</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>{bookingType === 'monthly' ? 'Move-in Date *' : 'Check-in Date *'}</Label>
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

                        {bookingType === 'per_night' ? (
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
                        ) : (
                          <div className="space-y-2">
                            <Label>Number of Months *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={months}
                              onChange={(e) => setMonths(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                          </div>
                        )}
                        </div>

                        {/* Discount code */}
                        <div className={bookingStep === 2 ? "space-y-4" : "hidden"}>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Discount Code (optional)</Label>
                          {discountInfo ? (
                            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-md px-3 py-2">
                              <div className="text-sm">
                                <span className="font-mono font-bold">{discountInfo.code}</span>
                                <span className="text-green-700 dark:text-green-400 ml-2">−KSh {discountInfo.discountAmount.toLocaleString()}</span>
                              </div>
                              <Button type="button" size="sm" variant="ghost" onClick={removeDiscount}>Remove</Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER10" />
                              <Button type="button" variant="outline" onClick={applyDiscount} disabled={discountChecking || !discountCode.trim()}>
                                {discountChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Totals */}
                        <div className="bg-secondary/50 p-4 rounded-lg space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>KSh {unitPrice.toLocaleString()} × {duration} {bookingType === 'monthly' ? 'month' : 'night'}{duration > 1 ? 's' : ''}</span>
                            <span>KSh {subtotalAmount.toLocaleString()}</span>
                          </div>
                          {discountInfo && (
                            <div className="flex justify-between text-sm text-green-700 dark:text-green-400">
                              <span>Discount ({discountInfo.code})</span>
                              <span>−KSh {discountInfo.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-1">
                            <span>Total</span>
                            <span className="text-primary">KSh {totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                        </div>

                        {/* M-Pesa phone */}
                        <div className={bookingStep === 3 ? "space-y-4" : "hidden"}>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> M-Pesa Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="07XXXXXXXX or 2547XXXXXXXX"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            We'll send an STK Push to this number — just enter your M-Pesa PIN to pay.
                          </p>
                        </div>

                        {paymentStage !== "idle" && (
                          <div className={`rounded-md px-3 py-2 text-sm flex items-center gap-2 ${
                            paymentStage === "paid" ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                            paymentStage === "failed" ? "bg-destructive/10 text-destructive" :
                            paymentStage === "timeout" ? "bg-secondary text-secondary-foreground" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {paymentStage === "paid" ? <Check className="h-4 w-4" /> :
                             paymentStage === "failed" ? <X className="h-4 w-4" /> :
                             <Loader2 className="h-4 w-4 animate-spin" />}
                            {paymentStage === "prompt" && "Sending STK Push to your phone…"}
                            {paymentStage === "waiting" && "Waiting for you to enter your M-Pesa PIN…"}
                            {paymentStage === "paid" && "Payment confirmed!"}
                            {paymentStage === "failed" && "Payment not completed. You can retry."}
                            {paymentStage === "timeout" && "Payment confirmation is taking longer than usual."}
                            {paymentMessage && <span className="text-muted-foreground">{paymentMessage}</span>}
                          </div>
                        )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => bookingStep === 1 ? setShowBookingDialog(false) : setBookingStep((bookingStep - 1) as 1 | 2 | 3)}
                            className="flex-1"
                            disabled={bookingLoading}
                          >
                            {bookingStep === 1 ? "Cancel" : "Back"}
                          </Button>
                          {bookingStep < 3 ? (
                            <Button type="button" onClick={goNextBookingStep} className="flex-1 ocean-gradient">
                              Continue
                            </Button>
                          ) : (
                            <Button type="submit" disabled={bookingLoading || !checkInDate} className="flex-1 ocean-gradient">
                              {bookingLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : <>Pay KSh {totalAmount.toLocaleString()}</>}
                            </Button>
                          )}
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