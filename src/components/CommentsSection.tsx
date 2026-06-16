/**
 * @file src/components/CommentsSection.tsx
 * @description Comments section with create/delete functionality for TrendHub
 * @author TrendHub Engineering
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CommentWithAuthor } from "@/lib/database.types";

interface CommentsSectionProps {
  postId: string;
  onCountChange: (count: number) => void;
}

export function CommentsSection({ postId, onCountChange }: CommentsSectionProps) {
  const { user, profile } = useAuthStore();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("comments")
      .select("*, author:author_id(id,username,display_name,avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      const transformedComments = (data as any[]).map((comment: any) => ({
        ...comment,
        profiles: comment.author,
      }));
      setComments(transformedComments as CommentWithAuthor[]);
      onCountChange(data.length);
    }
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: user.id, content: text.trim() })
      .select("*, author:author_id(id,username,display_name,avatar_url)")
      .single();

    if (!error && data) {
      const transformedComment = {
        ...data,
        profiles: (data as any).author,
      };
      setComments((prev) => [...prev, transformedComment as CommentWithAuthor]);
      onCountChange(comments.length + 1);
      setText("");
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    await supabase.from("comments").delete().eq("id", commentId).eq("author_id", user.id);
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    onCountChange(updated.length);
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
      {fetching ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => {
            const name = comment.profiles.display_name || comment.profiles.username;
            return (
              <div key={comment.id} className="flex gap-2.5 group">
                <Link to={`/user/${comment.profiles.id}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={comment.profiles.avatar_url || ""} />
                    <AvatarFallback className="text-[10px]">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-800 rounded-xl px-3 py-2">
                    <Link
                      to={`/user/${comment.profiles.id}`}
                      className="text-xs font-semibold text-white hover:text-cyan-400 transition-colors"
                    >
                      {name}
                    </Link>
                    <p className="text-xs text-slate-300 mt-0.5 break-words">
                      {comment.content}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {user?.id === comment.author_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {comments.length === 0 && (
            <p className="text-center text-xs text-slate-600 py-2">
              Seja o primeiro a comentar!
            </p>
          )}
        </div>
      )}

      {/* Comment input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-[10px]">
              {(profile?.display_name || profile?.username || "TH").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicionar comentário..."
              className="h-8 text-xs"
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              variant="default"
              className="h-8 w-8 shrink-0"
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
