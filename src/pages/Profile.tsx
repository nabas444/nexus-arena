import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Upload, User as UserIcon, Save, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface ProfileRow {
  id: string;
  user_id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,handle,display_name,avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Could not load profile", { description: error.message });
      } else if (data) {
        setProfile(data);
        setHandle(data.handle);
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanHandle.length < 2) {
      toast.error("Handle too short", { description: "At least 2 characters: a-z, 0-9, _" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        handle: cleanHandle,
        display_name: displayName.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      const desc = error.message.includes("profiles_handle_key")
        ? "That handle is already taken."
        : error.message;
      toast.error("Save failed", { description: desc });
      return;
    }
    setHandle(cleanHandle);
    toast.success("Profile updated");
  };

  const handleAvatarPick = () => fileInput.current?.click();

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Max 4MB image");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed", { description: upErr.message });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("user_id", user.id);
    setUploading(false);
    if (updErr) {
      toast.error("Could not save avatar", { description: updErr.message });
      return;
    }
    setAvatarUrl(newUrl);
    toast.success("Avatar updated");
  };

  const handleAvatarRemove = async () => {
    if (!profile) return;
    setUploading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id);
    setUploading(false);
    if (error) {
      toast.error("Could not remove avatar", { description: error.message });
      return;
    }
    setAvatarUrl(null);
    toast.success("Avatar removed");
  };

  const initials = (handle || user.email || "??").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="container max-w-2xl py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <span className="font-mono text-[10px] tracking-[0.25em] text-primary">// PILOT PROFILE</span>
          <h1 className="font-display text-3xl md:text-5xl font-black">
            Your <span className="text-gradient">Identity</span>
          </h1>
          <p className="text-muted-foreground">
            How you appear across the arena. Update your handle, name, and avatar.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-mono text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            // LOADING PROFILE
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 space-y-6 border border-border"
          >
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-accent grid place-items-center font-display text-2xl font-bold ring-2 ring-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-background/60 grid place-items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">AVATAR</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarPick}
                    disabled={uploading}
                    className="font-semibold"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {avatarUrl ? "Replace" : "Upload"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={uploading}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">PNG, JPG, WEBP · max 4MB</p>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="handle">Handle</Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">@</span>
                  <Input
                    id="handle"
                    value={handle}
                    onChange={(e) =>
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    maxLength={24}
                    placeholder="vex0r"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Lowercase letters, numbers, and underscores. Must be unique.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="display">Display name</Label>
                <Input
                  id="display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  placeholder="Vex0r The Relentless"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
                  <UserIcon className="h-3.5 w-3.5" />
                  {user.email}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
};

export default Profile;
