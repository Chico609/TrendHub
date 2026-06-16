/**
 * @file src/pages/ProfilePage.tsx
 * @description User profile page with edit functionality
 * Shows posts, followers, following counts and allows profile update
 * @author TrendHub Engineering
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Edit, Loader2, UserPlus, UserMinus, MessageCircle, Globe, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { useToast } from "@/components/ui/toast";
import type { Profile, PostWithAuthor } from "@/lib/database.types";

export default function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: myProfile, fetchProfile } = useAuthStore();
  const { addToast } = useToast();

  // If no userId param, show own profile
  const targetId = userId || user?.id || "";
  const isOwnProfile = targetId === user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);

    const [{ data: profileData }, { data: postsData }, { count: followers }, { count: following }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", targetId).single(),
        supabase
          .from("posts")
          .select("*, author:author_id(id,username,display_name,avatar_url), likes(post_id), comments(id), communities(id,title,image_url)")
          .eq("author_id", targetId)
          .order("created_at", { ascending: false }),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetId),
      ]);

    setProfile(profileData as Profile);
    if (postsData) {
      const transformedPosts = (postsData as any[]).map((post: any) => ({
        ...post,
        profiles: post.author,
      }));
      setPosts(transformedPosts as PostWithAuthor[]);
    } else {
      setPosts([]);
    }
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    // Check if current user follows this profile
    if (user && !isOwnProfile) {
      const { data: followData } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetId)
        .single();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  }, [targetId, user, isOwnProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFollow = async () => {
    if (!user || isOwnProfile) return;
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowerCount((prev) => (newFollowing ? prev + 1 : prev - 1));

    if (newFollowing) {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetId });
      addToast({ type: "success", title: "Seguindo! 👏" });
    } else {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);
      addToast({ type: "info", title: "Deixou de seguir" });
    }
  };

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleProfileSaved = async () => {
    setShowEdit(false);
    if (user) {
      await fetchProfile(user.id);
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Usuário não encontrado.</p>
        <Link to="/feed">
          <Button variant="outline" className="mt-4">Voltar ao feed</Button>
        </Link>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-6">
        {/* Cover gradient */}
        <div className="h-24 -mx-6 -mt-6 mb-4 rounded-t-xl bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-violet-600/30" />

        <div className="flex items-end justify-between -mt-14 mb-4">
          <Avatar className="h-20 w-20 ring-4 ring-slate-900">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex gap-2 mt-14">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdit(true)}
              >
                <Edit className="h-4 w-4" />
                Editar perfil
              </Button>
            ) : (
              <>
                <Link to={`/chat?with=${profile.id}`}>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant={isFollowing ? "secondary" : "gradient"}
                  size="sm"
                  onClick={handleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Seguir
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div>
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            <p className="text-slate-500 text-sm">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-slate-300 text-sm leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Entrou{" "}
              {formatDistanceToNow(new Date(profile.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-2">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{posts.length}</p>
              <p className="text-xs text-slate-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{followerCount}</p>
              <p className="text-xs text-slate-500">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{followingCount}</p>
              <p className="text-xs text-slate-500">Seguindo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <Tabs defaultValue="posts">
        <TabsList className="mb-4">
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="likes">Curtidas</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Nenhum post ainda.</p>
              {isOwnProfile && (
                <Link to="/post/new">
                  <Button variant="gradient" size="sm" className="mt-4">
                    Criar primeiro post
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
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes">
          <div className="text-center py-12 text-slate-500 text-sm">
            Curtidas privadas por enquanto 🔒
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {isOwnProfile && (
        <ProfileEditDialog
          open={showEdit}
          profile={myProfile}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
