"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "../../services/api";
import { Megaphone, X, ChevronRight } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  targeting?: string;
  createdBy: { id: string; fullName: string; username: string };
  createdAt: string;
}

export function AnnouncementsBanner() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await api.get("/announcements");
      return data.data.announcements;
    },
    refetchInterval: 300000, // 5 minutes
  });

  const announcements: Announcement[] = data || [];
  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  // Show latest un-dismissed announcement as banner
  const latest = visible[0];

  return (
    <div className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white relative">
      <button
        onClick={() => setDismissed((prev) => new Set(prev).add(latest.id))}
        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{latest.title}</h3>
          <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{latest.message}</p>
          <p className="text-white/50 text-[10px] mt-1">
            Posted by {latest.createdBy.fullName}
          </p>
        </div>
      </div>

      {visible.length > 1 && (
        <Link
          href="/announcements"
          className="flex items-center gap-1 text-white/70 hover:text-white text-xs mt-2 transition"
        >
          <span>{visible.length - 1} more announcement{visible.length > 2 ? "s" : ""}</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
