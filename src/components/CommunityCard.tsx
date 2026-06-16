/**
 * @file src/components/CommunityCard.tsx
 * @description Community/Challenge card component with join, edit, and delete actions
 * @author TrendHub Engineering
 */

import { Link } from "react-router-dom";
import { Users, Edit, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Community } from "@/lib/database.types";
import { CATEGORIES } from "@/pages/CommunitiesPage";

interface CommunityCardProps {
  community: Community;
  isJoined: boolean;
  isOwner: boolean;
  onJoin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const statusVariantMap: Record<string, "active" | "paused" | "ended"> = {
  active: "active",
  paused: "paused",
  ended: "ended",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
};

export function CommunityCard({
  community,
  isJoined,
  isOwner,
  onJoin,
  onEdit,
  onDelete,
}: CommunityCardProps) {
  const category = CATEGORIES.find((c) => c.value === community.category);
  const CatIcon = category?.icon || Shield;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-200 flex flex-col">
      {/* Cover image */}
      {community.image_url ? (
        <div className="h-32 overflow-hidden">
          <img
            src={community.image_url}
            alt={community.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-violet-600/20 flex items-center justify-center">
          <CatIcon className="h-12 w-12 text-slate-600" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            to={`/communities/${community.id}`}
            className="font-semibold text-white hover:text-cyan-400 transition-colors line-clamp-1"
          >
            {community.title}
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            {isOwner && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                Criador
              </Badge>
            )}
            <Badge variant={statusVariantMap[community.status] || "outline"} className="text-[10px] px-1.5 py-0">
              {statusLabels[community.status] || community.status}
            </Badge>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5 mb-2">
          <CatIcon className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">{category?.label || community.category}</span>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3 flex-1">
            {community.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-800">
          <Button
            variant={isJoined ? "secondary" : "default"}
            size="sm"
            onClick={onJoin}
            className="flex-1"
          >
            <Users className="h-3.5 w-3.5" />
            {isJoined ? "Sair" : "Participar"}
          </Button>

          {isOwner && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Edit className="h-3.5 w-3.5 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-red-400 hover:bg-red-500/10"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
