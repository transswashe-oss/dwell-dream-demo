import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailLog {
  id: string;
  recipient: string;
  template: string;
  status: string;
  error: string | null;
  created_at: string;
  related_id: string | null;
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

const statusVariant = (status: string) => {
  switch (status) {
    case 'sent': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'queued': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-muted text-muted-foreground';
  }
};

const MessagesManagement = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<Record<string, EmailLog[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [{ data: msgs, error: mErr }, { data: emails, error: eErr }] = await Promise.all([
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      if (mErr) throw mErr;
      if (eErr) throw eErr;
      setMessages(msgs || []);
      const grouped: Record<string, EmailLog[]> = {};
      (emails || []).forEach((l: any) => {
        const key = l.related_id || '_orphan';
        (grouped[key] ||= []).push(l);
      });
      // Keep only latest per (recipient+template)
      Object.keys(grouped).forEach((k) => {
        const seen = new Set<string>();
        grouped[k] = grouped[k].filter((l) => {
          const key = `${l.recipient}|${l.template}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setLogs(grouped);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({ title: "Error", description: "Could not load messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase.from('messages').update({ read: true }).eq('id', messageId);
      if (error) throw error;
      toast({ title: "Success", description: "Message marked as read" });
      fetchAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update message", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-8">Loading messages...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Messages Management</h2>
        <div className="text-sm text-muted-foreground">
          {messages.filter(m => !m.read).length} unread messages
        </div>
      </div>

      {messages.length === 0 ? (
        <Card><CardContent className="text-center py-16"><p className="text-muted-foreground">No messages yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => {
            const msgLogs = logs[message.id] || [];
            return (
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
                          <a href={`mailto:${message.email}`} className="hover:text-primary">{message.email}</a>
                        </div>
                        {message.phone && (
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            <a href={`tel:${message.phone}`} className="hover:text-primary">{message.phone}</a>
                          </div>
                        )}
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{new Date(message.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-secondary/30 rounded-lg mb-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Email delivery</p>
                        {msgLogs.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No email log recorded</p>
                        ) : (
                          <div className="space-y-1">
                            {msgLogs.map((l) => (
                              <div key={l.id} className="flex items-center gap-2 text-xs">
                                <Badge className={statusVariant(l.status)}>{l.status}</Badge>
                                <span className="font-mono">{l.template}</span>
                                <span className="text-muted-foreground">→ {l.recipient}</span>
                                <span className="text-muted-foreground ml-auto">{new Date(l.created_at).toLocaleString()}</span>
                                {l.error && <span className="text-destructive ml-2">{l.error}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {!message.read && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(message.id)} className="ml-4">
                        <Check className="h-4 w-4 mr-1" />Mark as Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagesManagement;
