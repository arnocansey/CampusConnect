"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { formatDate } from "../utils";
import { Megaphone, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  targeting?: string;
  createdBy: { id: string; fullName: string; username: string };
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  ALL: { label: "Everyone", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  UNIVERSITY: { label: "University", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  DEPARTMENT: { label: "Department", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  ROLE: { label: "Role", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

export function AnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await api.get("/announcements");
      return data.data.announcements;
    },
  });

  const announcements: Announcement[] = data || [];

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/feed"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <Megaphone className="w-6 h-6 text-blue-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Announcements
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No announcements yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const typeInfo = TYPE_LABELS[announcement.type] || TYPE_LABELS.ALL;

            return (
              <div
                key={announcement.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {announcement.title}
                  </h2>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeInfo.color}`}
                  >
                    {typeInfo.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-3">
                  {announcement.message}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{announcement.createdBy.fullName}</span>
                  <span>·</span>
                  <span>{formatDate(announcement.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
