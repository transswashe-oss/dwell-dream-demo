import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Discount {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  amount: number;
  ends_at: string | null;
}

const useCountdown = (target: Date | null) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: diff === 0 };
};

const Cell = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-white/15 backdrop-blur-sm border border-white/30 shadow-lg flex items-center justify-center overflow-hidden">
      <span
        key={value}
        className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums animate-[fadeInUp_0.4s_ease-out]"
      >
        {value.toString().padStart(2, "0")}
      </span>
    </div>
    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-white/80 mt-1">{label}</span>
  </div>
);

const DiscountCountdown = () => {
  const [d, setD] = useState<Discount | null>(null);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("discounts")
        .select("*")
        .eq("active", true)
        .gt("ends_at", nowIso)
        .order("ends_at", { ascending: true })
        .limit(1);
      setD((data && data[0]) || null);
    })();
  }, []);

  const target = d?.ends_at ? new Date(d.ends_at) : null;
  const t = useCountdown(target);

  if (!d || !t || t.expired) return null;

  const discountLabel =
    d.discount_type === "percentage" ? `${d.amount}% OFF` : `KSh ${Number(d.amount).toLocaleString()} OFF`;

  return (
    <section className="relative py-10 sm:py-14 overflow-hidden">
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 24px hsl(var(--primary) / 0.4); } 50% { box-shadow: 0 0 48px hsl(var(--primary) / 0.7); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      <div className="container mx-auto px-4">
        <div
          className="relative rounded-2xl p-6 sm:p-8 text-white overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(195 80% 30%) 50%, hsl(220 60% 25%) 100%)",
            animation: "pulseGlow 3s ease-in-out infinite",
          }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 4s linear infinite",
            }}
          />
          <div className="relative grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Limited-Time Offer
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-2 leading-tight">
                {discountLabel} — Code <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{d.code}</span>
              </h2>
              {d.description && <p className="text-white/90 text-sm sm:text-base mb-4">{d.description}</p>}
              <p className="flex items-center gap-2 text-white/80 text-sm">
                <Clock className="h-4 w-4" /> Hurry — offer ends soon!
              </p>
              <Link
                to="/apartments"
                className="mt-5 inline-flex items-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-all"
              >
                <Tag className="h-4 w-4" /> Book Now & Save <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex gap-3 sm:gap-4 justify-center lg:justify-end">
              <Cell value={t.days} label="Days" />
              <Cell value={t.hours} label="Hours" />
              <Cell value={t.minutes} label="Mins" />
              <Cell value={t.seconds} label="Secs" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountCountdown;
