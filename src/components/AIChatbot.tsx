import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Msg {
  role: "user" | "assistant";
  content: string;
  recommendations?: Array<{ id: string; name: string; location: string; price: number; monthly_price: number; display_image?: string }>;
}

const AIChatbot = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm NyaliBot 🌊 — ask me about our coastal stays or long-term rentals in Mombasa." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chatbot", {
        body: { messages: next.map(({ role, content }) => ({ role, content })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.reply, recommendations: data.recommendations }]);
    } catch (e: any) {
      toast({ title: "Chat error", description: e.message || "Could not reach NyaliBot", variant: "destructive" });
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I had a hiccup. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full ocean-gradient text-white shadow-property-hover flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <Card className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[92vw] h-[520px] max-h-[80vh] flex flex-col shadow-property-hover overflow-hidden">
          <div className="ocean-gradient text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <div className="font-semibold leading-tight">NyaliBot</div>
                <div className="text-xs text-white/80">AI Concierge • Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.recommendations.map((r) => (
                        <Link key={r.id} to={`/apartments/${r.id}`} className="flex gap-2 bg-card rounded-lg p-2 hover:shadow-coastal transition-shadow border">
                          {r.display_image && <img src={r.display_image} alt={r.name} className="h-12 w-12 rounded object-cover flex-shrink-0" />}
                          <div className="min-w-0">
                            <div className="font-medium text-foreground text-xs truncate">{r.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.location}</div>
                            <div className="text-xs text-primary font-semibold">KSh {r.price?.toLocaleString()}/night{r.monthly_price ? ` • KSh ${r.monthly_price.toLocaleString()}/mo` : ""}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t bg-card flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about apartments, prices, bookings…"
              disabled={loading}
            />
            <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="ocean-gradient flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIChatbot;
