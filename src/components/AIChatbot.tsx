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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, loading]);

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
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 h-14 w-14 rounded-full ocean-gradient text-white shadow-property-hover flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <Card
          className="
            fixed z-50 flex flex-col shadow-property-hover overflow-hidden bg-card
            inset-x-2 bottom-2 top-2 rounded-2xl
            sm:inset-auto sm:bottom-5 sm:right-5 sm:top-auto sm:w-[380px] sm:h-[560px] sm:max-h-[80vh]
          "
        >
          {/* Header */}
          <div className="ocean-gradient text-white px-3 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold leading-tight truncate">NyaliBot</div>
                <div className="text-[11px] text-white/80 truncate">AI Concierge • Online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 -mr-1 hover:bg-white/10 rounded-full flex-shrink-0"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3 bg-background"
            style={{ WebkitOverflowScrolling: "touch" as any }}
          >
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.recommendations.map((r) => (
                        <Link
                          key={r.id}
                          to={`/apartments/${r.id}`}
                          onClick={() => setOpen(false)}
                          className="flex gap-2 bg-card rounded-lg p-2 hover:shadow-coastal active:scale-[0.99] transition border"
                        >
                          {r.display_image && (
                            <img
                              src={r.display_image}
                              alt={r.name}
                              loading="lazy"
                              className="h-14 w-14 rounded-md object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground text-xs sm:text-sm truncate">{r.name}</div>
                            <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{r.location}</div>
                            <div className="text-[11px] sm:text-xs text-primary font-semibold mt-0.5">
                              KSh {r.price?.toLocaleString()}/night
                              {r.monthly_price ? ` • KSh ${r.monthly_price.toLocaleString()}/mo` : ""}
                            </div>
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

          {/* Input */}
          <div
            className="p-2 border-t bg-card flex gap-2 flex-shrink-0"
            style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about apartments, prices…"
              disabled={loading}
              className="flex-1 text-base sm:text-sm"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={loading || !input.trim()}
              className="ocean-gradient flex-shrink-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIChatbot;
