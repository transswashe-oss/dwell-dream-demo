import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  footer_text: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  whatsapp_number: string;
}

const DEFAULTS: SiteSettings = {
  contact_email: "omaryw003@gmail.com",
  contact_phone: "+254 725 409 996",
  contact_address: "Nyali, Mombasa, Kenya",
  footer_text: "Your trusted coastal partner in Mombasa — short stays and long-term rentals along Nyali shore.",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  whatsapp_number: "+254725409996",
};

const Ctx = createContext<{ settings: SiteSettings; refresh: () => void }>({ settings: DEFAULTS, refresh: () => {} });

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  const load = async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (data) setSettings({ ...DEFAULTS, ...data } as SiteSettings);
  };

  useEffect(() => { load(); }, []);

  return <Ctx.Provider value={{ settings, refresh: load }}>{children}</Ctx.Provider>;
};

export const useSiteSettings = () => useContext(Ctx);
