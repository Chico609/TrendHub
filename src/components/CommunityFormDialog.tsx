/**
 * @file src/components/CommunityFormDialog.tsx
 * @description CRUD form dialog for creating and editing Communities/Challenges
 * Enforces creator_id = auth.uid() on insert; RLS protects update/delete
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CATEGORIES } from "@/pages/CommunitiesPage";
import type { Community } from "@/lib/database.types";

interface CommunityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTarget: Community | null;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "ended", label: "Encerrado" },
];

export function CommunityFormDialog({
  open,
  onClose,
  onSaved,
  editTarget,
}: CommunityFormDialogProps) {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("trending");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "ended">("active");
  const [rules, setRules] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!editTarget;

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      setTitle(editTarget.title);
      setDescription(editTarget.description || "");
      setCategory(editTarget.category);
      setImageUrl(editTarget.image_url || "");
      setStatus(editTarget.status);
      setRules(editTarget.rules || "");
    } else {
      resetForm();
    }
  }, [editTarget, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("trending");
    setImageUrl("");
    setStatus("active");
    setRules("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      image_url: imageUrl.trim() || null,
      status,
      rules: rules.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (isEdit && editTarget) {
      // RLS: update only allowed if auth.uid() = creator_id
      const { error } = await supabase
        .from("communities")
        .update(payload)
        .eq("id", editTarget.id);

      if (error) {
        addToast({ type: "error", title: "Erro ao atualizar", description: error.message });
      } else {
        addToast({ type: "success", title: "Comunidade atualizada! ✅" });
        onSaved();
        resetForm();
      }
    } else {
      // RLS: insert sets creator_id = auth.uid()
      const { error } = await supabase.from("communities").insert({
        ...payload,
        creator_id: user.id,
      });

      if (error) {
        addToast({ type: "error", title: "Erro ao criar", description: error.message });
      } else {
        addToast({ type: "success", title: "Comunidade criada! 🎉" });
        // Auto-join the community
        const { data: created } = await supabase
          .from("communities")
          .select("id")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (created) {
          await supabase
            .from("community_members")
            .insert({ community_id: (created as { id: string }).id, user_id: user.id });
        }

        onSaved();
        resetForm();
      }
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Comunidade" : "Nova Comunidade / Desafio"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize as informações da sua comunidade."
              : "Crie um novo desafio criativo para a comunidade TrendHub."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="c-title">
              Título <span className="text-red-400">*</span>
            </Label>
            <Input
              id="c-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desafio do Pôr do Sol 📸"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="c-desc">Descrição</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta comunidade ou desafio..."
              maxLength={500}
              className="min-h-[80px]"
            />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "active" | "paused" | "ended")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="c-image">URL da imagem de capa</Label>
            <Input
              id="c-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/capa.jpg"
            />
            {imageUrl && (
              <div className="rounded-lg overflow-hidden h-24 bg-slate-800">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              </div>
            )}
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="c-rules">Regras breves</Label>
            <Textarea
              id="c-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Ex: 1. Respeite todos. 2. Apenas conteúdo original. 3. Use a hashtag #trend."
              maxLength={1000}
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={loading || !title.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar comunidade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
