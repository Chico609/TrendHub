/**
 * @file src/lib/database.types.ts
 * @description TypeScript types matching the Supabase PostgreSQL schema for TrendHub
 * @author TrendHub Engineering
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          updated_at?: string;
        };
      };
      communities: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          category: string;
          image_url: string | null;
          status: "active" | "paused" | "ended";
          rules: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          category: string;
          image_url?: string | null;
          status?: "active" | "paused" | "ended";
          rules?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          image_url?: string | null;
          status?: "active" | "paused" | "ended";
          rules?: string | null;
          updated_at?: string;
        };
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          community_id: string | null;
          content: string;
          media_url: string | null;
          media_type: "image" | "video" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          community_id?: string | null;
          content: string;
          media_url?: string | null;
          media_type?: "image" | "video" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          media_url?: string | null;
          media_type?: "image" | "video" | null;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: never;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: never;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type PostWithAuthor = Post & {
  profiles: Profile;
  likes: Like[];
  comments: Comment[];
  communities: Community | null;
};

export type CommentWithAuthor = Comment & {
  profiles: Profile;
};

export type MessageWithProfiles = Message & {
  sender: Profile;
  receiver: Profile;
};
