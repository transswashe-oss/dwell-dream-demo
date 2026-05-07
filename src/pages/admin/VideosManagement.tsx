import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Video, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ApartmentVideo {
  id: string;
  apartment_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  featured: boolean;
  created_at: string;
  apartments?: { name: string } | null;
}

interface ApartmentLite { id: string; name: string }

const VideosManagement = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<ApartmentVideo[]>([]);
  const [apartments, setApartments] = useState<ApartmentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApartmentVideo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [apartmentId, setApartmentId] = useState<string>("none");

  const fetchAll = async () => {
    setLoading(true);
    const [vRes, aRes] = await Promise.all([
      supabase.from("apartment_videos").select("*, apartments(name)").order("created_at", { ascending: false }),
      supabase.from("apartments").select("id,name").order("name"),
    ]);
    setVideos((vRes.data || []) as ApartmentVideo[]);
    setApartments((aRes.data || []) as ApartmentLite[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const reset = () => {
    setEditing(null); setVideoFile(null); setThumbFile(null); setApartmentId("none");
  };

  const openCreate = () => { reset(); setOpen(true); };
  const openEdit = (v: ApartmentVideo) => {
    setEditing(v); setApartmentId(v.apartment_id || "none"); setVideoFile(null); setThumbFile(null); setOpen(true);
  };

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const name = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("apartment-videos").upload(name, file);
    if (error) throw error;
    return supabase.storage.from("apartment-videos").getPublicUrl(name).data.publicUrl;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      let videoUrl = editing?.video_url || "";
      let thumbUrl = editing?.thumbnail_url || null;
      if (videoFile) videoUrl = await upload(videoFile);
      if (thumbFile) thumbUrl = await upload(thumbFile);
      if (!videoUrl) throw new Error("Please upload a video file.");

      const payload = {
        title: (fd.get("title") as string).trim(),
        description: (fd.get("description") as string)?.trim() || null,
        apartment_id: apartmentId === "none" ? null : apartmentId,
        video_url: videoUrl,
        thumbnail_url: thumbUrl,
        featured: fd.get("featured") === "on",
      };

      if (editing) {
        const { error } = await supabase.from("apartment_videos").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Video updated" });
      } else {
        const { error } = await supabase.from("apartment_videos").insert(payload);
        if (error) throw error;
        toast({ title: "Video uploaded" });
      }
      setOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Could not save video", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("apartment_videos").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchAll();
  };

  if (loading) return <div className="text-center py-8">Loading videos…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6" /> Shorts & Videos</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Upload Video</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Video" : "Upload Video"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" defaultValue={editing?.title} required />
              </div>
              <div className="space-y-2">
                <Label>Apartment (optional)</Label>
                <Select value={apartmentId} onValueChange={setApartmentId}>
                  <SelectTrigger><SelectValue placeholder="Link to apartment…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {apartments.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description || ""} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video">Video file {editing ? "(replace)" : "*"}</Label>
                <Input id="video" type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} required={!editing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumb">Thumbnail (optional)</Label>
                <Input id="thumb" type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="featured" name="featured" defaultChecked={editing?.featured} />
                <Label htmlFor="featured" className="cursor-pointer">Featured on homepage</Label>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Saving…" : "Save Video"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {videos.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground">No videos yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map(v => (
            <Card key={v.id} className="overflow-hidden card-3d">
              <video src={v.video_url} poster={v.thumbnail_url || undefined} controls className="w-full h-48 object-cover bg-black" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{v.title}</span>
                  {v.featured && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Featured</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {v.apartments?.name && <p className="text-xs text-muted-foreground">📍 {v.apartments.name}</p>}
                {v.description && <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(v)}><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(v.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideosManagement;
