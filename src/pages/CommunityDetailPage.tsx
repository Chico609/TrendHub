/**
 * @file src/pages/CommunityDetailPage.tsx
 * @description Individual community/challenge detail page for TrendHub
 * Shows community info, members, posts, and rules
 * @author TrendHub Engineering
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Shield,
  Calendar,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/PostCard";
import { CommunityFormDialog } from "@/components/CommunityFormDialog";
import { useToast } from "@/components/ui/toast";
import { CATEGORIES } from "@/pages/CommunitiesPage";
import type { Community, PostWithAuthor } from "@/lib/database.types";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
};

const statusVariants: Record<string, "active" | "paused" | "ended"> = {
  active: "active",
  paused: "paused",
  ended: "ended",
};

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const isOwner = community?.creator_id === user?.id;

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      setLoading(true);

      const [{ data: commData }, { data: postsData }, { count }, { data: memberData }] =
        await Promise.all([
          supabase.from("communities").select("*").eq("id", id).single(),
          supabase
            .from("posts")
            .select("*, profiles(*), likes(*), comments(*), communities(*)")
            .eq("community_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("community_id", id),
          supabase
            .from("community_members")
            .select("user_id")
            .eq("community_id", id)
            .eq("user_id", user.id)
            .single(),
        ]);

      setCommunity(commData as Community);
      setPosts((postsData as PostWithAuthor[]) || []);
      setMemberCount(count || 0);
      setIsJoined(!!memberData);
      setLoading(false);
    };

    load();
  }, [id, user]);

  const handleJoin = async () => {
    if (!user || !community) return;
    if (isJoined) {
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", user.id);
      setIsJoined(false);
      setMemberCount((p) => p - 1);
      addToast({ type: "info", title: "Você saiu da comunidade" });
    } else {
      await supabase
        .from("community_members")
        .insert({ community_id: community.id, user_id: user.id });
      setIsJoined(true);
      setMemberCount((p) => p + 1);
      addToast({ type: "success", title: "Você entrou! 🎉" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Comunidade não encontrada.</p>
        <Link to="/communities">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.value === community.category);
  const CatIcon = category?.icon || Shield;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        to="/communities"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Comunidades
      </Link>

      {/* Cover + Info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden mb-6">
        {community.image_url ? (
          <div className="h-40 overflow-hidden">
            <img
              src={community.image_url}
              alt={community.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-violet-600/20 flex items-center justify-center">
            <CatIcon className="h-16 w-16 text-slate-700" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{community.title}</h1>
                <Badge variant={statusVariants[community.status] || "outline"}>
                  {statusLabels[community.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <CatIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-500">{category?.label}</span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEdit(true)}
                  >
                    <Edit className="h-4 w-4 text-slate-400" />
                  </Button>
                </>
              )}
              <Button
                variant={isJoined ? "secondary" : "gradient"}
                size="sm"
                onClick={handleJoin}
              >
                <Users className="h-4 w-4" />
                {isJoined ? "Sair" : "Participar"}
              </Button>
            </div>
          </div>

          {community.description && (
            <p className="text-slate-300 mb-4">{community.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {memberCount} membros
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Criada{" "}
              {formatDistanceToNow(new Date(community.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          {/* Rules */}
          {community.rules && (
            <div className="mt-4 p-4 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Regras</h3>
              </div>
              <p className="text-sm text-slate-400 whitespace-pre-wrap">
                {community.rules}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Posts ({posts.length})
          </h2>
          {isJoined && (
            <Link to={`/post/new`}>
              <Button variant="outline" size="sm">
                Postar na comunidade
              </Button>
            </Link>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Nenhum post nesta comunidade ainda.</p>
            {isJoined && (
              <Link to="/post/new">
                <Button variant="gradient" size="sm" className="mt-4">
                  Seja o primeiro!
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {isOwner && (
        <CommunityFormDialog
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            window.location.reload();
          }}
          editTarget={community}
        />
      )}
    </div>
  );
}
