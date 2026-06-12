"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  X,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface AdminNote {
  id: string;
  title: string;
  description?: string;
  course: string;
  department: string;
  level: number;
  semester?: string;
  fileUrl: string;
  fileType: string;
  isApproved: boolean;
  uploader: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  _count: {
    downloads: number;
    ratings: number;
    comments: number;
  };
  createdAt: string;
}

export default function AdminNotesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [approvedFilter, setApprovedFilter] = useState<string>("ALL");
  const [viewNote, setViewNote] = useState<AdminNote | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminNote | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notes", search, approvedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (approvedFilter !== "ALL") params.append("isApproved", approvedFilter);
      const { data } = await api.get(`/admin/notes?${params}`);
      return data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { data } = await api.patch(`/admin/notes/${id}/approve`, { isApproved: !isApproved });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      toast.success(vars.isApproved ? "Approval revoked" : "Note approved");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.delete(`/admin/notes/${id}`, { data: { reason } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      setRemoveTarget(null);
      setRemoveReason("");
      toast.success("Note removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove note");
    },
  });

  const notes: AdminNote[] = data?.notes || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Notes Moderation
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Review, approve, and manage uploaded study notes
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search notes, courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status:</span>
        <div className="flex gap-1">
          {["ALL", "true", "false"].map((v) => (
            <button
              key={v}
              onClick={() => setApprovedFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                approvedFilter === v
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {v === "ALL" ? "All" : v === "true" ? "Approved" : "Pending"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No notes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Note</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Course</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Uploader</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Downloads</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Approved</th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => (
                  <tr
                    key={note.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                            {note.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {note.fileType} &middot; Level {note.level}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{note.course}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{note.department?.replace("_", " ")}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {note.uploader.profilePicture ? (
                          <img src={note.uploader.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {note.uploader.fullName?.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">{note.uploader.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Download className="w-3.5 h-3.5" />
                        {note._count.downloads}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          approveMutation.mutate({ id: note.id, isApproved: note.isApproved })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                          note.isApproved
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        }`}
                      >
                        {note.isApproved ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {note.isApproved ? "Approved" : "Pending"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewNote(note)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!note.isApproved && (
                          <button
                            onClick={() => {
                              approveMutation.mutate({ id: note.id, isApproved: false });
                            }}
                            className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRemoveTarget(note);
                            setRemoveReason("");
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Note Modal */}
      {viewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewNote(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-4">{viewNote.title}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Course</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewNote.course}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Department</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewNote.department?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Level</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewNote.level}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">File Type</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewNote.fileType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Uploader</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewNote.uploader.fullName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Downloads</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewNote._count.downloads}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {viewNote.isApproved ? "Approved" : "Pending Review"}
                </span>
              </div>
              {viewNote.description && (
                <div className="py-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Description</span>
                  <p className="text-gray-900 dark:text-white mt-1">{viewNote.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {!viewNote.isApproved && (
                <Button
                  onClick={() => {
                    approveMutation.mutate({ id: viewNote.id, isApproved: false });
                    setViewNote(null);
                  }}
                >
                  Approve
                </Button>
              )}
              <Button variant="ghost" onClick={() => setViewNote(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject/Remove Reason Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl">
            <button
              onClick={() => { setRemoveTarget(null); setRemoveReason(""); }}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Remove Note</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Removing <span className="font-semibold">{removeTarget.title}</span>. Please provide a reason:
            </p>
            <textarea
              placeholder="Reason for removal..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => { setRemoveTarget(null); setRemoveReason(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!removeReason.trim() || removeMutation.isPending}
                onClick={() =>
                  removeMutation.mutate({ id: removeTarget.id, reason: removeReason })
                }
              >
                {removeMutation.isPending ? "Removing..." : "Remove Note"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
