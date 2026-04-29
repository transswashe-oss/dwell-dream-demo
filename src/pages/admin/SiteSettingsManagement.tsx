import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const SiteSettingsManagement = () => {
  const { toast } = useToast();
  const { refresh } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      setForm(data || {});
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { id, updated_at, ...patch } = form;
    const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Settings saved", description: "Changes are live across the site." }); refresh(); }
  };

  if (loading) return <div className="text-center py-12">Loading…</div>;

  const field = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <Card className="shadow-coastal">
      <CardHeader><CardTitle>🛠️ Site Settings</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Contact Email</Label>
            <Input value={form.contact_email || ""} onChange={field("contact_email")} />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input value={form.contact_phone || ""} onChange={field("contact_phone")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={form.contact_address || ""} onChange={field("contact_address")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Footer Text</Label>
            <Textarea rows={3} value={form.footer_text || ""} onChange={field("footer_text")} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsapp_number || ""} onChange={field("whatsapp_number")} placeholder="+254725409996" />
          </div>
          <div className="space-y-2">
            <Label>Facebook URL</Label>
            <Input value={form.facebook_url || ""} onChange={field("facebook_url")} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Twitter / X URL</Label>
            <Input value={form.twitter_url || ""} onChange={field("twitter_url")} />
          </div>
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input value={form.instagram_url || ""} onChange={field("instagram_url")} />
          </div>
          <div className="space-y-2">
            <Label>LinkedIn URL</Label>
            <Input value={form.linkedin_url || ""} onChange={field("linkedin_url")} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving} className="ocean-gradient">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SiteSettingsManagement;
