"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "../../services/api";
import { User } from "../../types";
import { X, Search, Users } from "lucide-react";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "followers" | "following" | "likers";
  username?: string;
  postId?: string;
}

export function UserListModal({ isOpen, onClose, title, type, username, postId }: UserListModalProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [type, username || postId],
    queryFn: async () => {
      let endpoint = "";
      if (type === "followers") endpoint = `/users/${username}/followers`;
      else if (type === "following") endpoint = `/users/${username}/following`;
      else if (type === "likers") endpoint = `/posts/${postId}/likers`;

      const { data } = await api.get(endpoint);
      return data.data;
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const users: Pick<User, "id" | "username" | "fullName" | "profilePicture" | "department" | "isVerified">[] =
    data?.users || [];

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md h-[70vh] max-h-[500px] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
            <span className="text-sm text-gray-400 dark:text-gray-500">({data?.total || 0})</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search ? "No users found" : `No ${type} yet`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.fullName?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {user.fullName}
                      </p>
                      {user.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                      {user.department ? ` · ${user.department}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
