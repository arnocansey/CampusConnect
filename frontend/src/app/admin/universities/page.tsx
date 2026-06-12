"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Plus,
  X,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface University {
  id: string;
  name: string;
  location: string;
  logo?: string;
  isVerified: boolean;
  _count?: {
    students: number;
  };
}

export default function AdminUniversitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUni, setEditUni] = useState<University | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-universities", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const { data } = await api.get(`/admin/universities?${params}`);
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; location: string }) => {
      const { data } = await api.post("/admin/universities", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      resetForm();
      toast.success("University created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create university");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name: string; location: string }) => {
      const { data } = await api.patch(`/admin/universities/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      resetForm();
      toast.success("University updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update university");
    },
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const { data } = await api.patch(`/admin/universities/${id}/verify`, { isVerified: !isVerified });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      toast.success(vars.isVerified ? "Verification removed" : "University verified");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/universities/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      toast.success("University deleted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete university");
    },
  });

  const resetForm = () => {
    setShowAddModal(false);
    setEditUni(null);
    setName("");
    setLocation("");
  };

  const openEdit = (uni: University) => {
    setEditUni(uni);
    setName(uni.name);
    setLocation(uni.location);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    if (editUni) {
      updateMutation.mutate({ id: editUni.id, name, location });
    } else {
      createMutation.mutate({ name, location });
    }
  };

  const handleDelete = (uni: University) => {
    if (confirm(`Delete "${uni.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(uni.id);
    }
  };

  const universities: University[] = data?.universities || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" /> University Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage universities and verification status
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add University
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search universities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
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
        ) : universities.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No universities found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">University</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Location</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Students</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Verified</th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {universities.map((uni) => (
                  <tr
                    key={uni.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {uni.logo ? (
                          <img src={uni.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {uni.name?.charAt(0)}
                          </div>
                        )}
                        <p className="font-semibold text-gray-900 dark:text-white">{uni.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {uni.location}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                        {uni._count?.students || 0}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          toggleVerifiedMutation.mutate({ id: uni.id, isVerified: uni.isVerified })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                          uni.isVerified
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {uni.isVerified ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {uni.isVerified ? "Verified" : "Unverified"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(uni)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(uni)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete"
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl">
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-4">
              {editUni ? "Edit University" : "Add University"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  University Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. University of Ghana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Legon, Accra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" type="button" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editUni
                    ? "Save Changes"
                    : "Add University"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
