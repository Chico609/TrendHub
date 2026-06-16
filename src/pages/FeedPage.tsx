/**
 * @file src/pages/FeedPage.tsx
 * @description Main feed page showing posts from followed users and joined communities
 * Implements infinite scroll pattern with real Supabase queries
 * @author TrendHub Engineering
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, PlusCircle, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PostWithAuthor } from "@/lib/database.types";

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get following list
      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = followData?.map((f) => f.following_id) || [];

      // Get joined communities
      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      const communityIds = memberData?.map((m) => m.community_id) || [];

      // Build filter conditions
      const authorIds = [...new Set([...followingIds, user.id])];
      let filterCondition = "";

      if (authorIds.length > 0) {
        filterCondition += `author_id.in.(${authorIds.join(",")})`;
      }
      if (communityIds.length > 0) {
        if (filterCondition) {
          filterCondition += ",";
        }
        filterCondition += `community_id.in.(${communityIds.join(",")})`;
      }

      let query = supabase
        .from("posts")
        .select("*, author:author_id(id,username,display_name,avatar_url), likes(post_id), comments(id), communities(id,title,image_url)")
        .order("created_at", { ascending: false })
        .limit(30);

      // Apply filters if they exist
      if (filterCondition) {
        query = query.or(filterCondition);
      }

      const { data: feedData, error } = await query;

      if (error) {
        console.error("Feed fetch error:", error);
        setPosts([]);
      } else {
        const postsResult = (feedData as any[]) || [];
        // Transform data to match PostWithAuthor type
        const transformedPosts = postsResult.map((post: any) => ({
          ...post,
          profiles: post.author,
        }));
        const uniquePosts = transformedPosts.filter(
          (post, index, self) => self.findIndex((p) => p.id === post.id) === index
        );
        setPosts(uniquePosts);
      }
    } catch (error) {
      console.error("Feed error:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTrending = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, author:author_id(id,username,display_name,avatar_url), likes(post_id), comments(id), communities(id,title,image_url)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Trending fetch error:", error);
        setTrendingPosts([]);
      } else if (data) {
        // Transform data to match PostWithAuthor type
        const transformedPosts = (data as any[]).map((post: any) => ({
          ...post,
          profiles: post.author,
        }));
        const sorted = transformedPosts.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        setTrendingPosts(sorted);
      }
    } catch (error) {
      console.error("Trending error:", error);
      setTrendingPosts([]);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    fetchTrending();
  }, [fetchFeed, fetchTrending]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    await fetchTrending();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTrendingPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <p className="text-sm text-slate-400">
            Posts de quem você segue, suas comunidades e os mais recentes do TrendHub
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Link to="/post/new">
            <Button variant="gradient" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Postar</span>
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="following">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="following" className="flex-1">
            Seguindo
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex-1">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
                <PlusCircle className="h-8 w-8 text-slate-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Seu feed está vazio</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Siga usuários ou participe de comunidades para ver posts aqui
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Link to="/explore">
                  <Button variant="outline" size="sm">
                    Explorar usuários
                  </Button>
                </Link>
                <Link to="/communities">
                  <Button variant="default" size="sm">
                    Ver comunidades
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending">
          {trendingPosts.length === 0 ? (
            <div className="text-center py-16">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mx-auto" />
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
                  <PostCard post={post} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
