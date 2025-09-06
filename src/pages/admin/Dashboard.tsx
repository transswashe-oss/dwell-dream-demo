import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Routes, Route, Link, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Calendar, 
  MessageSquare, 
  Users, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalApartments: number;
  totalBookings: number;
  pendingBookings: number;
  totalMessages: number;
}

interface Booking {
  id: string;
  transaction_code: string;
  status: string;
  created_at: string;
  apartments: {
    name: string;
    price: number;
    type: string;
  };
  profiles: {
    name: string;
  };
}

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  created_at: string;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApartments: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalMessages: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [apartmentsRes, bookingsRes, messagesRes] = await Promise.all([
        supabase.from('apartments').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id, status', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
      ]);

      const pendingBookings = bookingsRes.data?.filter(b => b.status === 'Pending').length || 0;

      setStats({
        totalApartments: apartmentsRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings,
        totalMessages: messagesRes.count || 0,
      });

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          apartments(name, price, type),
          profiles(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings(bookingsData || []);

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          Loading dashboard...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-coastal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Apartments</p>
                <p className="text-3xl font-bold">{stats.totalApartments}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-coastal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold">{stats.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-coastal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Bookings</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-coastal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-3xl font-bold">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{booking.apartments.name}</h4>
                      <Badge 
                        className={
                          booking.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.profiles.name} • {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Transaction: {booking.transaction_code}
                    </p>
                  </div>
                  {booking.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBookingAction(booking.id, 'Approved')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBookingAction(booking.id, 'Rejected')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card className="shadow-coastal">
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-muted-foreground">No messages yet</p>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{message.name}</h4>
                    <Badge variant={message.read ? 'secondary' : 'default'}>
                      {message.read ? 'Read' : 'New'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {message.email} {message.phone && `• ${message.phone}`}
                  </p>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          Loading...
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your StayMombasa properties and bookings</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <Link to="/admin">
            <Button 
              variant={location.pathname === '/admin' ? 'default' : 'outline'}
              className="whitespace-nowrap"
            >
              Overview
            </Button>
          </Link>
          <Button variant="outline" className="whitespace-nowrap" disabled>
            Apartments
          </Button>
          <Button variant="outline" className="whitespace-nowrap" disabled>
            Bookings
          </Button>
          <Button variant="outline" className="whitespace-nowrap" disabled>
            Messages
          </Button>
        </div>

        {/* Dashboard Content */}
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="*" element={<AdminOverview />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;