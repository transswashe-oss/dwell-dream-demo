import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const WHATSAPP_NUMBER = "254742009757";
const QUICK_QUESTIONS = [
  "Hi! I'd like to book a short stay in Nyali.",
  "Do you have monthly rentals available?",
  "What are your prices for beachfront apartments?",
  "Can I see more pictures of a property?",
  "How does the M-Pesa payment work?",
];

const WhatsAppChat = () => {
  const [open, setOpen] = useState(false);

  const sendTo = (msg: string) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {open && (
        <Card className="mb-3 w-80 shadow-2xl card-3d animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
          <div className="bg-green-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Chat on WhatsApp</p>
                <p className="text-xs opacity-90">Pick a question to get started</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 space-y-2 bg-card">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendTo(q)}
                className="w-full text-left text-sm p-3 rounded-md border hover:bg-green-50 hover:border-green-500 transition-all hover:translate-x-1"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      )}
      <Button
        onClick={() => setOpen((o) => !o)}
        size="icon"
        className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-2xl card-3d"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </Button>
    </div>
  );
};

export default WhatsAppChat;
