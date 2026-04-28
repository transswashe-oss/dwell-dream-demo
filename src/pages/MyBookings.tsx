import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CreditCard, Clock, Moon, Download, Home, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { generateInvoicePDF } from "@/lib/invoice";
import { useToast } from "@/hooks/use-toast";

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
  apartment: {
    id: string;
    name: string;
    location: string;
    price: number;
    monthly_price: number | null;
    display_image?: string;
    unit_number?: string | null;
  };
}

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchBookings(); }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, apartment:apartments(id, name, location, price, monthly_price, display_image, unit_number)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data as any || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (b: Booking) => {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('name').eq('user_id', user!.id).single();
      const isMonthly = b.booking_type === 'monthly';
      await generateInvoicePDF({
        bookingId: b.id,
        clientName: profile?.name || 'Guest',
        clientEmail: user!.email || '',
        apartmentName: b.apartment.name,
        apartmentLocation: b.apartment.location,
        bookingType: isMonthly ? 'monthly' : 'per_night',
        checkInDate: b.check_in_date ? format(new Date(b.check_in_date), 'PPP') : '',
        checkInTime: b.check_in_time || undefined,
        duration: isMonthly ? (b.months || 1) : (b.nights || 1),
        unitPrice: isMonthly ? (b.apartment.monthly_price || 0) : b.apartment.price,
        totalAmount: b.total_amount || 0,
        transactionCode: b.transaction_code,
        status: b.status,
        unitNumber: b.assigned_unit_number || b.apartment.unit_number || undefined,
        createdAt: b.created_at,
      });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Could not generate receipt', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen page-bg">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">Loading bookings...</div>
        <Footer />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen page-bg">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Track your short-stays and rentals — download receipts anytime</p>
        </div>

        {bookings.length === 0 ? (
          <Card className="text-center py-16 bg-card/90 backdrop-blur-sm">
            <CardContent>
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">Browse our properties to find your perfect stay or rental.</p>
              <a href="/apartments" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Browse Properties
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const isMonthly = booking.booking_type === 'monthly';
              return (
                <Card key={booking.id} className="shadow-property bg-card/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <CardTitle className="text-xl mb-2 flex items-center gap-2">
                          {booking.apartment.name}
                          <Badge variant="outline" className="text-xs">
                            {isMonthly ? 'Monthly Rental' : 'Short Stay'}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{booking.apartment.location}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {booking.assigned_unit_number && (
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 mr-2 text-primary" />
                          <div>
                            <div className="font-medium">Unit Number</div>
                            <div className="text-muted-foreground font-mono">{booking.assigned_unit_number}</div>
                          </div>
                        </div>
                      )}
                      {booking.check_in_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <div>
                            <div className="font-medium">{isMonthly ? 'Move-in Date' : 'Check-in Date'}</div>
                            <div className="text-muted-foreground">{format(new Date(booking.check_in_date), 'PPP')}</div>
                          </div>
                        </div>
                      )}
                      {booking.check_in_time && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <div>
                            <div className="font-medium">Time</div>
                            <div className="text-muted-foreground">{booking.check_in_time}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center">
                        {isMonthly ? <Home className="h-4 w-4 mr-2 text-primary" /> : <Moon className="h-4 w-4 mr-2 text-primary" />}
                        <div>
                          <div className="font-medium">Duration</div>
                          <div className="text-muted-foreground">
                            {isMonthly ? `${booking.months || 1} month(s)` : `${booking.nights || 1} night(s)`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Transaction</div>
                          <div className="text-muted-foreground font-mono">{booking.transaction_code}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-primary mr-2 font-bold">KSh</span>
                        <div>
                          <div className="font-medium">Total</div>
                          <div className="text-muted-foreground">
                            KSh {(booking.total_amount || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm text-muted-foreground">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadReceipt(booking)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt (PDF)
                      </Button>
                    </div>

                    {booking.status === 'Approved' && booking.assigned_unit_number && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Confirmed!</strong> Your assigned unit is <strong className="font-mono">{booking.assigned_unit_number}</strong>. Show this on arrival.
                        </p>
                      </div>
                    )}
                    {booking.status === 'Pending' && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Awaiting approval.</strong> You'll be emailed your unit number and full details once approved.
                        </p>
                      </div>
                    )}
                    {booking.status === 'Rejected' && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Declined.</strong> Please contact support for more information.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyBookings;
