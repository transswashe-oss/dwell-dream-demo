import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, User, CreditCard, Moon, Clock, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Booking {
  id: string;
  transaction_code: string;
  status: string;
  created_at: string;
  check_in_date: string | null;
  check_in_time: string | null;
  nights: number | null;
  months: number | null;
  booking_type: string;
  assigned_unit_number: string | null;
  total_amount: number | null;
  user_id: string;
  apartments: {
    name: string;
    price: number;
    monthly_price: number | null;
    type: string;
    location: string;
    display_image: string | null;
    description: string;
    rooms: number;
    bathrooms: number | null;
    google_maps_url: string | null;
    unit_number: string | null;
  };
  profiles: {
    name: string;
    phone: string | null;
    email: string | null;
  };
}

const BookingsManagement = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          apartments(name, price, monthly_price, type, location, display_image, description, rooms, bathrooms, google_maps_url, unit_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (bookingsData) {
        const bookingsWithProfiles = await Promise.all(
          bookingsData.map(async (booking) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, phone, email')
              .eq('user_id', booking.user_id)
              .single();
            
            return {
              ...booking,
              profiles: { 
                name: profile?.name || 'Unknown User',
                phone: profile?.phone || null,
                email: profile?.email || null,
              }
            };
          })
        );
        setBookings(bookingsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Could not load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (booking: Booking, status: 'Approved' | 'Rejected') => {
    try {
      const { data: updated, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', booking.id)
        .select('assigned_unit_number')
        .single();

      if (error) throw error;
      const unitNumber = updated?.assigned_unit_number || booking.apartments.unit_number || '';

      try {
        await supabase.functions.invoke('send-booking-status-email', {
          body: {
            clientEmail: booking.profiles.email,
            clientName: booking.profiles.name,
            clientPhone: booking.profiles.phone || '',
            apartmentName: booking.apartments.name,
            apartmentLocation: booking.apartments.location,
            apartmentImage: booking.apartments.display_image || '',
            apartmentDescription: booking.apartments.description || '',
            apartmentRooms: booking.apartments.rooms || 1,
            apartmentBathrooms: booking.apartments.bathrooms,
            apartmentPrice: booking.apartments.price,
            apartmentGoogleMapsUrl: booking.apartments.google_maps_url,
            checkInDate: booking.check_in_date ? format(new Date(booking.check_in_date), 'PPP') : 'Not specified',
            checkInTime: booking.check_in_time || 'Not specified',
            nights: booking.nights || 0,
            months: booking.months || 0,
            bookingType: booking.booking_type,
            unitNumber,
            totalAmount: booking.total_amount || booking.apartments.price,
            transactionCode: booking.transaction_code,
            status,
          },
        });
        console.log('Status email sent successfully');
      } catch (emailError) {
        console.error('Error sending status email:', emailError);
      }

      toast({
        title: "Success",
        description: `Booking ${status.toLowerCase()} successfully. Email notification sent to client.`,
      });

      fetchBookings();
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Could not update booking",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bookings Management</h2>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">No bookings yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="shadow-coastal">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Apartment Image */}
                  {booking.apartments.display_image && (
                    <div className="hidden md:block flex-shrink-0">
                      <img 
                        src={booking.apartments.display_image} 
                        alt={booking.apartments.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{booking.apartments.name}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    
                    {/* Client Details Section */}
                    <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Client Information</h4>
                      <div className="grid md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{booking.profiles.name}</span>
                        </div>
                        {booking.profiles.email && (
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{booking.profiles.email}</span>
                          </div>
                        )}
                        {booking.profiles.phone && (
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{booking.profiles.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Booking Details */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span><strong>Transaction:</strong> {booking.transaction_code}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span><strong>Booked:</strong> {new Date(booking.created_at).toLocaleDateString()}</span>
                      </div>
                      {booking.check_in_date && (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span><strong>Check-in:</strong> {format(new Date(booking.check_in_date), 'PPP')}</span>
                        </div>
                      )}
                      {booking.check_in_time && (
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          <span><strong>Time:</strong> {booking.check_in_time}</span>
                        </div>
                      )}
                      {booking.nights && (
                        <div className="flex items-center text-muted-foreground">
                          <Moon className="h-4 w-4 mr-2" />
                          <span><strong>Nights:</strong> {booking.nights}</span>
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground">
                        <span className="mr-2">💰</span>
                        <span><strong>Total:</strong> KSh {(booking.total_amount || booking.apartments.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {booking.status === 'Pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(booking, 'Approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(booking, 'Rejected')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;
