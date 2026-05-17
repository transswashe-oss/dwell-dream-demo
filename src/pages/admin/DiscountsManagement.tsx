import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tag, Pencil, Save } from "lucide-react";

interface Discount {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  amount: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

const emptyForm = { code: "", description: "", discount_type: "percentage", amount: 10, starts_at: "", ends_at: "", active: true };

const toLocalDt = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const DiscountsManagement = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("discounts").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Preflight: confirm authenticated admin session before insert (helps surface RLS issues clearly)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in as an admin to create discounts.", variant: "destructive" });
      return;
    }
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      toast({ title: "Permission denied", description: "Your account doesn't have the admin role. Sign out and back in, or contact support.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("discounts").insert({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      amount: Number(form.amount),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      active: form.active,
    });
    if (error) {
      const msg = error.code === "23505"
        ? `A discount with code "${form.code.trim().toUpperCase()}" already exists.`
        : error.message.includes("row-level security")
        ? "Permission denied — please sign out and sign in again as an admin."
        : error.message;
      toast({ title: "Could not create discount", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Discount created" });
      setForm(emptyForm);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this discount?")) return;
    await supabase.from("discounts").delete().eq("id", id);
    load();
  };

  const toggle = async (d: Discount) => {
    await supabase.from("discounts").update({ active: !d.active }).eq("id", d.id);
    load();
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    setEditForm({
      code: d.code,
      description: d.description || "",
      discount_type: d.discount_type,
      amount: Number(d.amount),
      starts_at: toLocalDt(d.starts_at),
      ends_at: toLocalDt(d.ends_at),
      active: d.active,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const { error } = await supabase.from("discounts").update({
      code: editForm.code.trim().toUpperCase(),
      description: editForm.description.trim() || null,
      discount_type: editForm.discount_type,
      amount: Number(editForm.amount),
      starts_at: editForm.starts_at || null,
      ends_at: editForm.ends_at || null,
      active: editForm.active,
    }).eq("id", editing.id);
    setSavingEdit(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Discount updated" });
      setEditing(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-coastal">
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create Discount</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUMMER10" required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (KSh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off all coastal stays this month" />
            </div>
            <div className="space-y-2">
              <Label>Starts at</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ends at</Label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Active</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="ocean-gradient"><Plus className="h-4 w-4 mr-2" /> Save Discount</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-coastal">
        <CardHeader><CardTitle>All Discounts ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? "Loading…" : items.length === 0 ? <p className="text-muted-foreground">No discounts yet.</p> : (
            <div className="space-y-3">
              {items.map((d) => (
                <div key={d.id} className="border rounded-lg p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-mono font-bold">{d.code}</span>
                      <Badge variant={d.active ? "default" : "secondary"}>{d.active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline">
                        {d.discount_type === "percentage" ? `${d.amount}% off` : `KSh ${Number(d.amount).toLocaleString()} off`}
                      </Badge>
                    </div>
                    {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {d.starts_at ? `From ${new Date(d.starts_at).toLocaleDateString()}` : "No start"} → {d.ends_at ? `To ${new Date(d.ends_at).toLocaleDateString()}` : "No end"}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggle(d)}>{d.active ? "Disable" : "Enable"}</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(d.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editForm.discount_type} onValueChange={(v) => setEditForm({ ...editForm, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (KSh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" min={0} value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Starts at</Label>
              <Input type="datetime-local" value={editForm.starts_at} onChange={(e) => setEditForm({ ...editForm, starts_at: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ends at</Label>
              <Input type="datetime-local" value={editForm.ends_at} onChange={(e) => setEditForm({ ...editForm, ends_at: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch checked={editForm.active} onCheckedChange={(v) => setEditForm({ ...editForm, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="ocean-gradient">
              <Save className="h-4 w-4 mr-2" /> {savingEdit ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountsManagement;
