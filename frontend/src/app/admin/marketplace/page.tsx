"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Search,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  ImageOff,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

interface AdminMarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  isApproved: boolean;
  isAvailable: boolean;
  seller: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
}

const categories = ["ALL", "BOOKS", "ELECTRONICS", "CLOTHING", "ACCESSORIES", "SERVICES", "HOSTEL_ITEMS", "OTHER"] as const;

export default function AdminMarketplacePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [approvedFilter, setApprovedFilter] = useState<string>("ALL");
  const [viewItem, setViewItem] = useState<AdminMarketplaceItem | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removeTarget, setRemoveTarget] = useState<AdminMarketplaceItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addCategory, setAddCategory] = useState("OTHER");
  const [addCondition, setAddCondition] = useState("NEW");
  const [addLocation, setAddLocation] = useState("");
  const [addImages, setAddImages] = useState<FileList | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-marketplace", search, categoryFilter, approvedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (approvedFilter !== "ALL") params.append("isApproved", approvedFilter);
      const { data } = await api.get(`/admin/marketplace?${params}`);
      return data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { data } = await api.patch(`/admin/marketplace/${id}/approve`, { isApproved: !isApproved });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace"] });
      toast.success(vars.isApproved ? "Approval revoked" : "Item approved");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.delete(`/admin/marketplace/${id}`, { data: { reason } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace"] });
      setRemoveTarget(null);
      setRemoveReason("");
      toast.success("Item removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove item");
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", addTitle);
      formData.append("description", addDescription);
      formData.append("price", addPrice);
      formData.append("category", addCategory);
      formData.append("condition", addCondition);
      formData.append("isApproved", "true");
      if (addLocation) formData.append("location", addLocation);
      if (addImages) {
        for (let i = 0; i < addImages.length; i++) {
          formData.append("images", addImages[i]);
        }
      }
      const { data } = await api.post("/admin/marketplace", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace"] });
      setShowAddModal(false);
      setAddTitle("");
      setAddDescription("");
      setAddPrice("");
      setAddCategory("OTHER");
      setAddCondition("NEW");
      setAddLocation("");
      setAddImages(null);
      toast.success("Item created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create item");
    },
  });

  const items: AdminMarketplaceItem[] = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" /> Marketplace Moderation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Review, approve, and remove marketplace listings
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Category:</span>
          <div className="flex gap-1 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  categoryFilter === c
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {c === "ALL" ? "All" : c.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Table */}
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
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No listings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Item</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Price</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Seller</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Category</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Approved</th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <ImageOff className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">
                            {item.description?.slice(0, 50)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white hidden md:table-cell">
                      {item.currency === "GHS" ? "GH₵" : "$"}{item.price?.toLocaleString()}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {item.seller.profilePicture ? (
                          <img src={item.seller.profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {item.seller.fullName?.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.seller.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {item.category?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          approveMutation.mutate({ id: item.id, isApproved: item.isApproved })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                          item.isApproved
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        }`}
                      >
                        {item.isApproved ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {item.isApproved ? "Approved" : "Pending"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewItem(item)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRemoveTarget(item);
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

      {/* View Item Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewItem(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-4">{viewItem.title}</h2>
            {viewItem.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {viewItem.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-full h-32 object-cover rounded-xl"
                  />
                ))}
              </div>
            )}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Price</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {viewItem.currency === "GHS" ? "GH₵" : "$"}{viewItem.price?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Category</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewItem.category?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Seller</span>
                <span className="text-gray-900 dark:text-white font-medium">{viewItem.seller.fullName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {viewItem.isApproved ? "Approved" : "Pending Review"}
                </span>
              </div>
              {viewItem.description && (
                <div className="py-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">Description</span>
                  <p className="text-gray-900 dark:text-white mt-1">{viewItem.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setViewItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Reason Modal */}
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
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Remove Listing</h2>
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
                {removeMutation.isPending ? "Removing..." : "Remove Listing"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white mb-4">Add Marketplace Item</h2>
            <div className="space-y-3">
              <Input
                placeholder="Title *"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
              />
              <textarea
                placeholder="Description *"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                rows={3}
              />
              <Input
                type="number"
                placeholder="Price (GH₵) *"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 dark:text-white"
                >
                  {["BOOKS", "ELECTRONICS", "CLOTHING", "ACCESSORIES", "SERVICES", "HOSTEL_ITEMS", "OTHER"].map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </select>
                <select
                  value={addCondition}
                  onChange={(e) => setAddCondition(e.target.value)}
                  className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 dark:text-white"
                >
                  {["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Location (optional)"
                value={addLocation}
                onChange={(e) => setAddLocation(e.target.value)}
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Images (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setAddImages(e.target.files)}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button
                disabled={!addTitle.trim() || !addDescription.trim() || !addPrice || createItemMutation.isPending}
                onClick={() => createItemMutation.mutate()}
              >
                {createItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {createItemMutation.isPending ? "Creating..." : "Create Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
