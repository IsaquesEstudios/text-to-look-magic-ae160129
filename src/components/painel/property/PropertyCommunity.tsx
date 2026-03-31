import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDemoGuard } from "@/hooks/useDemoGuard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Camera, Image as ImageIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Props {
  propertyId: string;
}

export function PropertyCommunity({ propertyId }: Props) {
  const { user, isAdmin } = useAuth();
  const isDemoBlocked = useDemoGuard();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaPopoverOpen, setMediaPopoverOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["property-messages", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_messages")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`messages-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "property_messages",
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["property-messages", propertyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    if (isDemoBlocked()) return;
    setSending(true);
    const { error } = await supabase.from("property_messages").insert({
      property_id: propertyId,
      user_id: user.id,
      content: message.trim(),
    });
    if (!error) setMessage("");
    setSending(false);
  };

  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop();
    const path = `community/${propertyId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("property-media")
      .upload(path, file, { contentType: file.type });

    if (!error) {
      const { data } = supabase.storage.from("property-media").getPublicUrl(path);
      await supabase.from("property_messages").insert({
        property_id: propertyId,
        user_id: user.id,
        media_url: data.publicUrl,
        media_type: isVideo ? "video" : "image",
      });
    }
    setUploading(false);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 space-y-4">
        {/* Messages area */}
        <div className="h-96 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !messages?.length ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma atualização ainda.
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-xl bg-secondary/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Admin</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.content && <p className="text-sm text-foreground">{msg.content}</p>}
                {msg.media_url && msg.media_type === "image" && (
                  <img
                    src={msg.media_url}
                    alt=""
                    className="rounded-lg max-h-64 object-cover"
                    loading="lazy"
                  />
                )}
                {msg.media_url && msg.media_type === "video" && (
                  <video
                    src={msg.media_url}
                    controls
                    className="rounded-lg max-h-64 w-full"
                  />
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input - Admin only */}
        {isAdmin && (
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Enviar atualização..."
              maxLength={2000}
            />
            <Popover open={mediaPopoverOpen} onOpenChange={setMediaPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="end">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                  onClick={() => {
                    setMediaPopoverOpen(false);
                    cameraInputRef.current?.click();
                  }}
                >
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Câmera
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                  onClick={() => {
                    setMediaPopoverOpen(false);
                    galleryInputRef.current?.click();
                  }}
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Galeria
                </button>
              </PopoverContent>
            </Popover>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={uploadMedia}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={uploadMedia}
              className="hidden"
            />
            <Button variant="cta" size="icon" onClick={sendMessage} disabled={sending || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
