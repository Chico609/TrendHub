/**
 * @file src/components/ProfileEditDialog.tsx
 * @description Profile editing dialog for TrendHub
 * RLS ensures only the profile owner can update their data
 * @author TrendHub Engineering
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/database.types";

interface ProfileEditDialogProps {
  open: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProfileEditDialog({
  open,
  profile,
  onClose,
  onSaved,
}: ProfileEditDialogProps) {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setWebsite(profile.website || "");
    }
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        website: website.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      addToast({ type: "error", title: "Erro ao salvar perfil", description: error.message });
    } else {
      addToast({ type: "success", title: "Perfil atualizado! ✅" });
      onSaved();
    }
    setLoading(false);
  };

  const initials = (displayName || profile?.username || "TH").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações públicas de perfil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">URL do avatar</Label>
              <Input
                id="avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome público"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fale um pouco sobre você..."
              maxLength={200}
              className="min-h-[80px]"
            />
            <p className="text-xs text-slate-500 text-right">{bio.length}/200</p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website / Link</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://meusite.com"
            />
          </div>

          {/* Username (read-only) */}
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={`@${profile?.username || ""}`}
              disabled
              className="opacity-50"
            />
            <p className="text-xs text-slate-600">O username não pode ser alterado.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
