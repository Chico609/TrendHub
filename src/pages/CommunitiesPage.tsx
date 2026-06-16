/**
 * @file src/pages/CommunitiesPage.tsx
 * @description Communities listing and management page for TrendHub
 * Implements full CRUD for Community/Challenge (title, description, category, image, status, rules)
 * All operations are RLS-protected and linked to auth.uid() via creator_id
 * @author TrendHub Engineering
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Loader2,
  Shield,
  TrendingUp,
  Zap,
  Music,
  Palette,
  Code,
  Globe,
  Star,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { CommunityCard } from "@/components/CommunityCard";
import { CommunityFormDialog } from "@/components/CommunityFormDialog";
import type { Community } from "@/lib/database.types";

export const CATEGORIES = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "music", label: "Música", icon: Music },
  { value: "art", label: "Arte", icon: Palette },
  { value: "tech", label: "Tecnologia", icon: Code },
  { value: "lifestyle", label: "Lifestyle", icon: Star },
  { value: "sports", label: "Esportes", icon: Zap },
  { value: "global", label: "Global", icon: Globe },
  { value: "other", label: "Outros", icon: Shield },
];

export default function CommunitiesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Community | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    if (!user) return;

    const [{ data: allData }, { data: memberData }] = await Promise.all([
      supabase
        .from("communities")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id),
    ]);

    const ids = new Set((memberData || []).map((m) => (m as { community_id: string }).community_id));
    setJoinedIds(ids);

    const all = (allData as Community[]) || [];
    setCommunities(all);
    setMyCommunities(all.filter((c) => c.creator_id === user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleJoin = async (communityId: string) => {
    if (!user) return;
    const isJoined = joinedIds.has(communityId);

    if (isJoined) {
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id);
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
      addToast({ type: "info", title: "Você saiu da comunidade" });
    } else {
      await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: user.id });
      setJoinedIds((prev) => new Set([...prev, communityId]));
      addToast({ type: "success", title: "Você entrou na comunidade! 🎉" });
    }
  };

  const handleDelete = async (community: Community) => {
    if (!user || user.id !== community.creator_id) return;
    const { error } = await supabase
      .from("communities")
      .delete()
      .eq("id", community.id);

    if (error) {
      addToast({ type: "error", title: "Erro ao excluir comunidade" });
    } else {
      addToast({ type: "success", title: "Comunidade excluída" });
      fetchAll();
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditTarget(null);
    fetchAll();
  };

  const filtered = communities.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || c.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Comunidades</h1>
          <p className="text-sm text-slate-400">Desafios e trends criativos</p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Criar comunidade</span>
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar comunidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <div className="flex gap-1 overflow-x-auto pb-1 max-w-xs sm:max-w-none">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                categoryFilter === "all"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-500 hover:text-white bg-slate-800"
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  categoryFilter === cat.value
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-500 hover:text-white bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="discover">
        <TabsList className="mb-6">
          <TabsTrigger value="discover">
            <Globe className="h-4 w-4 mr-1.5" />
            Descobrir
          </TabsTrigger>
          <TabsTrigger value="joined">
            <Users className="h-4 w-4 mr-1.5" />
            Minhas ({joinedIds.size})
          </TabsTrigger>
          <TabsTrigger value="created">
            <Shield className="h-4 w-4 mr-1.5" />
            Criadas ({myCommunities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users className="h-12 w-12 text-slate-700 mx-auto" />
              <p className="text-slate-400">Nenhuma comunidade encontrada</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditTarget(null);
                  setShowForm(true);
                }}
              >
                Criar a primeira!
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  isJoined={joinedIds.has(community.id)}
                  isOwner={community.creator_id === user?.id}
                  onJoin={() => handleJoin(community.id)}
                  onEdit={() => {
                    setEditTarget(community);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDelete(community)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communities
              .filter((c) => joinedIds.has(c.id))
              .map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  isJoined
                  isOwner={community.creator_id === user?.id}
                  onJoin={() => handleJoin(community.id)}
                  onEdit={() => {
                    setEditTarget(community);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDelete(community)}
                />
              ))}
            {joinedIds.size === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                Você ainda não entrou em nenhuma comunidade.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                isJoined={joinedIds.has(community.id)}
                isOwner
                onJoin={() => handleJoin(community.id)}
                onEdit={() => {
                  setEditTarget(community);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(community)}
              />
            ))}
            {myCommunities.length === 0 && (
              <div className="col-span-2 text-center py-12 space-y-3">
                <p className="text-slate-400">Você ainda não criou comunidades.</p>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    setEditTarget(null);
                    setShowForm(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Criar agora
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <CommunityFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTarget(null);
        }}
        onSaved={handleSaved}
        editTarget={editTarget}
      />
    </div>
  );
}
