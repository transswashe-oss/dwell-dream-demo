import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  apartments: { name: string } | null;
}

const RecentVideos = () => {
  const [videos, setVideos] = useState<VideoRow[]>([]);

  useEffect(() => {
    supabase
      .from("apartment_videos")
      .select("id,title,description,video_url,thumbnail_url,apartments(name)")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setVideos((data || []) as VideoRow[]));
  }, []);

  if (videos.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="inline-flex items-center gap-2"><Play className="h-7 w-7 text-primary" /> Latest Property Shorts</span>
          </h2>
          <p className="text-muted-foreground">Quick video tours of our newest coastal listings</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Card key={v.id} className="overflow-hidden card-3d transition-all duration-300 hover:shadow-coastal">
              <div className="relative aspect-video bg-black">
                <video
                  src={v.video_url}
                  poster={v.thumbnail_url || undefined}
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{v.title}</h3>
                {v.apartments?.name && <p className="text-xs text-primary">📍 {v.apartments.name}</p>}
                {v.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{v.description}</p>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentVideos;
