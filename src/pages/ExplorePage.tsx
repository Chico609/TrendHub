/**
 * @file src/pages/ExplorePage.tsx
 * @description Explore page to discover users and trending posts
 * @author TrendHub Engineering
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, UserMinus, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { useToast } from "@/components/ui/toast";
import type { Profile, PostWithAuthor } from "@/lib/database.types";

export default function ExplorePage() {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<PostWithAuthor[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);

  // Fetch trending posts
  useEffect(() => {
    const fetchTrending = async () => {
      setPostsLoading(true);
      const { data } = await supabase
        .from("posts")
        .select("*, author:author_id(id,username,display_name,avatar_url), likes(post_id), comments(id), communities(id,title,image_url)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        const transformedPosts = (data as any[]).map((post: any) => ({
          ...post,
          profiles: post.author,
        }));
        const sorted = transformedPosts.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        setTrendingPosts(sorted as PostWithAuthor[]);
      }
      setPostsLoading(false);
    };

    fetchTrending();
  }, []);

  // Fetch following list
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (data) {
        setFollowingIds(new Set(data.map((f) => (f as { following_id: string }).following_id)));
      }
    };
    fetchFollowing();
  }, [user]);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("id", user?.id || "")
      .limit(20);

    setUsers((data as Profile[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(search), 400);
    return () => clearTimeout(timer);
  }, [search, searchUsers]);

  const handleFollow = async (profileId: string) => {
    if (!user) return;
    const isFollowing = followingIds.has(profileId);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
      addToast({ type: "info", title: "Deixou de seguir" });
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: profileId });
      setFollowingIds((prev) => new Set([...prev, profileId]));
      addToast({ type: "success", title: "Seguindo! 👏" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Explorar</h1>
        <p className="text-sm text-slate-400">Descubra usuários e tendências</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar usuários por nome ou @username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue={search ? "users" : "trending"}>
        <TabsList className="mb-6">
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="users">
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          {postsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {trendingPosts.map((post, i) => (
                <div key={post.id} className="relative">
                  {i < 3 && (
                    <div className="absolute -left-2 -top-2 z-10 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shadow">
                      #{i + 1}
                    </div>
                  )}
                  <PostCard post={post} />
                </div>
              ))}
              {trendingPosts.length === 0 && (
                <p className="text-center text-slate-400 py-12">
                  Nenhum post ainda. Seja o primeiro!
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
            </div>
          ) : search && users.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              Nenhum usuário encontrado para "{search}"
            </p>
          ) : !search ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              Digite algo para buscar usuários...
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const name = u.display_name || u.username;
                const isFollowing = followingIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <Link to={`/user/${u.id}`}>
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback>
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/user/${u.id}`}
                        className="font-semibold text-white hover:text-cyan-400 transition-colors block truncate"
                      >
                        {name}
                      </Link>
                      <p className="text-xs text-slate-500">@{u.username}</p>
                      {u.bio && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {u.bio}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={isFollowing ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleFollow(u.id)}
                    >
                      {isFollowing ? (
                        <UserMinus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      {isFollowing ? "Seguindo" : "Seguir"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
