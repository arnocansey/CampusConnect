"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Search,
  Users,
  Shield,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  MoreVertical,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
  isVerified: boolean;
  isSuspended?: boolean;
  isBanned?: boolean;
  status?: string;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
}

const roles = ["ALL", "STUDENT", "MODERATOR", "ADMIN"] as const;
const statuses = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"] as const;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);

  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, page, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      return data.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
      const { data } = await api.patch(`/admin/users/${id}/${suspend ? "suspend" : "reactivate"}`);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(vars.suspend ? "User suspended" : "User reactivated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ id, ban }: { id: string; ban: boolean }) => {
      const { data } = await api.patch(`/admin/users/${id}/${ban ? "ban" : "unban"}`);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(vars.ban ? "User banned" : "User unbanned");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleModalUser(null);
      toast.success("Role updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update role");
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.users) return;
    if (selectedIds.size === data.users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.users.map((u: AdminUser) => u.id)));
    }
  };

  const users: AdminUser[] = data?.users || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6" /> User Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage user accounts, roles, and access
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Role:</span>
          <div className="flex gap-1">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  roleFilter === r
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status:</span>
          <div className="flex gap-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {selectedIds.size} user(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                selectedIds.forEach((id) => banMutation.mutate({ id, ban: true }));
                setSelectedIds(new Set());
              }}
            >
              <Ban className="w-3.5 h-3.5 mr-1" /> Ban Selected
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-4 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {selectedIds.size === users.length && users.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Email</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Role</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Joined</th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="p-4">
                      <button
                        onClick={() => toggleSelect(user.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {selectedIds.has(user.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {user.fullName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : user.role === "MODERATOR"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          Banned
                        </span>
                      ) : user.isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewUser(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            suspendMutation.mutate({
                              id: user.id,
                              suspend: !user.isSuspended,
                            })
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                          title={user.isSuspended ? "Reactivate" : "Suspend"}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            banMutation.mutate({ id: user.id, ban: !user.isBanned })
                          }
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title={user.isBanned ? "Unban" : "Ban"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRoleModalUser(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                          title="Change role"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl">
            <button
              onClick={() => setViewUser(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-4">User Details</h2>
            <div className="flex items-center gap-4 mb-6">
              {viewUser.profilePicture ? (
                <img src={viewUser.profilePicture} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  {viewUser.fullName?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{viewUser.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{viewUser.username}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewUser.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {viewUser.isBanned ? "Banned" : viewUser.isSuspended ? "Suspended" : "Active"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Joined</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {new Date(viewUser.createdAt).toLocaleDateString()}
                </span>
              </div>
               {viewUser._count && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Posts</span>
                    <span className="text-gray-900 dark:text-white font-medium">{viewUser._count.posts}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Followers</span>
                    <span className="text-gray-900 dark:text-white font-medium">{viewUser._count.followers}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Following</span>
                    <span className="text-gray-900 dark:text-white font-medium">{viewUser._count.following}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setViewUser(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl">
            <button
              onClick={() => setRoleModalUser(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white mb-1">Change Role</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Assign a new role for <span className="font-semibold text-gray-700 dark:text-gray-300">{roleModalUser.fullName}</span>
            </p>
            <div className="space-y-2">
              {(["STUDENT", "MODERATOR", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => roleMutation.mutate({ id: roleModalUser.id, role: r })}
                  disabled={roleMutation.isPending || roleModalUser.role === r}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${
                    roleModalUser.role === r
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {r}
                    </div>
                    {roleModalUser.role === r && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setRoleModalUser(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
