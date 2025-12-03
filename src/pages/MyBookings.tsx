import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, CreditCard, Clock, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Booking {
  id: string;
  transaction_code: string;
  status: string;
  created_at: string;
  check_in_date: string | null;
  check_in_time: string | null;
  nights: number | null;
  total_amount: number | null;
  apartment: {
    id: string;
    name: string;
    location: string;
    price: number;
    display_image?: string;
  };
}

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          apartment:apartments(
            id,
            name,
            location,
            price,
            display_image
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return '✓';
      case 'Rejected':
        return '✗';
      default:
        return '⏳';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          Loading bookings...
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Bookings
          </h1>
          <p className="text-muted-foreground">
            Track the status of your Airbnb bookings
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings yet. Browse our apartments to find your perfect stay.
              </p>
              <a 
                href="/apartments"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Browse Apartments
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="shadow-property">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {booking.apartment.name}
                      </CardTitle>
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{booking.apartment.location}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusIcon(booking.status)} {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    {booking.check_in_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Check-in Date</div>
                          <div className="text-muted-foreground">
                            {format(new Date(booking.check_in_date), 'PPP')}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {booking.check_in_time && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Check-in Time</div>
                          <div className="text-muted-foreground">
                            {booking.check_in_time}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {booking.nights && (
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Duration</div>
                          <div className="text-muted-foreground">
                            {booking.nights} night{booking.nights > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="font-medium">Transaction</div>
                        <div className="text-muted-foreground font-mono">
                          {booking.transaction_code}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-primary mr-2">💰</span>
                      <div>
                        <div className="font-medium">Total Amount</div>
                        <div className="text-muted-foreground">
                          KSh {(booking.total_amount || booking.apartment.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    Booked on {new Date(booking.created_at).toLocaleDateString()}
                  </div>
                  
                  {booking.status === 'Pending' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Awaiting Admin Approval:</strong> Your booking request is being reviewed. 
                        You'll be notified once the admin verifies your payment and approves the booking.
                      </p>
                    </div>
                  )}
                  
                  {booking.status === 'Approved' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Booking Confirmed!</strong> Your booking has been approved. 
                        Contact the property manager for next steps.
                      </p>
                    </div>
                  )}
                  
                  {booking.status === 'Rejected' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Booking Declined:</strong> Your booking could not be processed. 
                        Please contact support for more information.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyBookings;