"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";


interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  maxUses: number;
  usedCount: number;
  minPurchase: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPromosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);

  const [newPromo, setNewPromo] = useState({
    code: "",
    description: "",
    discount: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    maxUses: "",
    minPurchase: "",
    expiresAt: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promos", search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("page", String(page));
      params.append("limit", "20");
      const { data } = await api.get(`/admin/promos?${params}`);
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof newPromo) => {
      const body: Record<string, any> = {
        code: payload.code.toUpperCase(),
        description: payload.description,
        discount: Number(payload.discount),
        discountType: payload.discountType,
        maxUses: payload.maxUses ? Number(payload.maxUses) : undefined,
        minPurchase: payload.minPurchase ? Number(payload.minPurchase) : undefined,
        expiresAt: payload.expiresAt || undefined,
      };
      const { data } = await api.post("/admin/promos", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
      setShowCreateModal(false);
      setNewPromo({
        code: "",
        description: "",
        discount: "",
        discountType: "PERCENTAGE",
        maxUses: "",
        minPurchase: "",
        expiresAt: "",
      });
      toast.success("Promo code created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create promo code");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await api.patch(`/admin/promos/${id}`, { isActive: !isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
      toast.success("Status updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/promos/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] });
      setDeleteTarget(null);
      toast.success("Promo code deleted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete promo code");
    },
  });

  const promos: PromoCode[] = data?.promos || [];
  const totalPages = data?.totalPages || 1;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (!newPromo.discount || Number(newPromo.discount) <= 0) {
      toast.error("Discount must be greater than 0");
      return;
    }
    createMutation.mutate(newPromo);
  };

  const formatDiscount = (discount: number, type: string) =>
    type === "PERCENTAGE" ? `${discount}%` : `GH₵${discount.toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6" /> Promo Codes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create and manage discount promo codes
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Promo Code
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No promo codes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Code</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Discount</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Type</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Used / Max</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Expiry</th>
                  <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Active</th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => (
                  <tr
                    key={promo.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm tracking-wide">
                          {promo.code}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[180px]">
                          {promo.description || "No description"}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white hidden md:table-cell">
                      {formatDiscount(promo.discount, promo.discountType)}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          promo.discountType === "PERCENTAGE"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {promo.discountType}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {promo.usedCount} / {promo.maxUses ?? "∞"}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {promo.expiresAt
                          ? new Date(promo.expiresAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({ id: promo.id, isActive: promo.isActive })
                        }
                        disabled={toggleMutation.isPending}
                        className="inline-flex items-center justify-center"
                      >
                        {promo.isActive ? (
                          <ToggleRight className="w-7 h-7 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDeleteTarget(promo)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-4">New Promo Code</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Code *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value }))}
                  className="uppercase tracking-wider"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Summer sale discount"
                  value={newPromo.description}
                  onChange={(e) => setNewPromo((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Discount *
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={newPromo.discount}
                    onChange={(e) => setNewPromo((p) => ({ ...p, discount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Type *
                  </label>
                  <div className="flex gap-2">
                    {(["PERCENTAGE", "FIXED"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewPromo((p) => ({ ...p, discountType: type }))}
                        className={`flex-1 h-10 rounded-xl text-xs font-medium border transition ${
                          newPromo.discountType === type
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        {type === "PERCENTAGE" ? "%" : "Fixed"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Max Uses
                  </label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    min="0"
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo((p) => ({ ...p, maxUses: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Min Purchase (GH₵)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={newPromo.minPurchase}
                    onChange={(e) => setNewPromo((p) => ({ ...p, minPurchase: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Expires At
                </label>
                <Input
                  type="datetime-local"
                  value={newPromo.expiresAt}
                  onChange={(e) => setNewPromo((p) => ({ ...p, expiresAt: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Promo Code"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Delete Promo Code</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.code}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
