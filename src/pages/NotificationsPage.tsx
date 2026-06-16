/**
 * @file src/pages/NotificationsPage.tsx
 * @description Notifications page showing recent likes, comments, follows for TrendHub
 * Derived from posts/likes/follows tables — no separate notifications table needed
 * @author TrendHub Engineering
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/lib/database.types";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  actor: Profile;
  postContent?: string;
  postId?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      setLoading(true);

      const notifs: Notification[] = [];

      // Recent likes on my posts
      const { data: myPosts } = await supabase
        .from("posts")
        .select("id, content")
        .eq("author_id", user.id)
        .limit(20);

      const myPostIds = (myPosts || []).map((p) => (p as { id: string }).id);

      if (myPostIds.length > 0) {
        const { data: likesData } = await supabase
          .from("likes")
          .select("user_id, post_id, created_at, user:user_id(id,username,display_name,avatar_url)")
          .in("post_id", myPostIds)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        for (const like of (likesData as Array<{ user_id: string; user: Profile; post_id: string; created_at: string }>) || []) {
          const post = (myPosts || []).find((p) => (p as { id: string }).id === like.post_id) as { id: string; content: string } | undefined;
          notifs.push({
            id: `like-${like.user_id}-${like.post_id}`,
            type: "like",
            actor: like.user,
            postContent: post?.content?.slice(0, 60) + "...",
            postId: like.post_id,
            createdAt: like.created_at,
          });
        }

        // Recent comments on my posts
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, author:author_id(id,username,display_name,avatar_url)")
          .in("post_id", myPostIds)
          .neq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        for (const comment of (commentsData as Array<{ id: string; author: Profile; post_id: string; created_at: string }>) || []) {
          notifs.push({
            id: `comment-${comment.id}`,
            type: "comment",
            actor: comment.author,
            postId: comment.post_id,
            createdAt: comment.created_at,
          });
        }
      }

      // New followers
      const { data: followsData } = await supabase
        .from("follows")
        .select("*, profiles!follows_follower_id_fkey(*)")
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      for (const follow of (followsData as Array<{ follower_id: string; profiles: Profile; created_at: string }>) || []) {
        notifs.push({
          id: `follow-${follow.follower_id}`,
          type: "follow",
          actor: follow.profiles,
          createdAt: follow.created_at,
        });
      }

      // Sort by date
      notifs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(notifs.slice(0, 30));
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const icons = {
    like: <Heart className="h-4 w-4 text-rose-400" />,
    comment: <MessageCircle className="h-4 w-4 text-cyan-400" />,
    follow: <UserPlus className="h-4 w-4 text-violet-400" />,
  };

  const texts = {
    like: "curtiu seu post",
    comment: "comentou no seu post",
    follow: "começou a te seguir",
  };

  const colors = {
    like: "bg-rose-500/10",
    comment: "bg-cyan-500/10",
    follow: "bg-violet-500/10",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notificações</h1>
        <p className="text-sm text-slate-400">Atividades recentes na sua conta</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400">Nenhuma notificação ainda.</p>
          <p className="text-slate-600 text-sm">
            Poste conteúdo para começar a receber interações!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const name = notif.actor?.display_name || notif.actor?.username || "Alguém";
            return (
              <div
                key={notif.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="relative">
                  <Link to={`/user/${notif.actor?.id || ""}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notif.actor?.avatar_url || ""} />
                      <AvatarFallback>
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${colors[notif.type]}`}
                  >
                    {icons[notif.type]}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <Link
                      to={`/user/${notif.actor?.id || ""}`}
                      className="font-semibold hover:text-cyan-400 transition-colors"
                    >
                      {name}
                    </Link>{" "}
                    <span className="text-slate-400">{texts[notif.type]}</span>
                  </p>
                  {notif.postContent && (
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {notif.postContent}
                    </p>
                  )}
                </div>

                <span className="text-xs text-slate-600 shrink-0">
                  {formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
