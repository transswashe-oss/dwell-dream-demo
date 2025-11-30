import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  created_at: string;
}

const MessagesManagement = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Could not load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message marked as read",
      });

      fetchMessages();
    } catch (error: any) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: error.message || "Could not update message",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Messages Management</h2>
        <div className="text-sm text-muted-foreground">
          {messages.filter(m => !m.read).length} unread messages
        </div>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <Card key={message.id} className={!message.read ? 'border-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{message.name}</h3>
                      <Badge variant={message.read ? 'secondary' : 'default'}>
                        {message.read ? 'Read' : 'New'}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${message.email}`} className="hover:text-primary">
                          {message.email}
                        </a>
                      </div>
                      {message.phone && (
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          <a href={`tel:${message.phone}`} className="hover:text-primary">
                            {message.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                  
                  {!message.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(message.id)}
                      className="ml-4"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark as Read
                    </Button>
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

export default MessagesManagement;
