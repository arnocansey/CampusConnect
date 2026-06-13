"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Megaphone,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";


interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  category: string;
  startDate: string;
  endDate: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

type DiscountType = "PERCENTAGE" | "FIXED";

type CategoryType =
  | "ALL"
  | "BOOKS"
  | "ELECTRONICS"
  | "CLOTHING"
  | "ACCESSORIES"
  | "SERVICES"
  | "HOSTEL_ITEMS"
  | "OTHER";

const CATEGORIES: CategoryType[] = [
  "ALL",
  "BOOKS",
  "ELECTRONICS",
  "CLOTHING",
  "ACCESSORIES",
  "SERVICES",
  "HOSTEL_ITEMS",
  "OTHER",
];

const CATEGORY_STYLES: Record<string, string> = {
  ALL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  BOOKS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ELECTRONICS:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CLOTHING:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  ACCESSORIES:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  SERVICES:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  HOSTEL_ITEMS:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  OTHER:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const ITEMS_PER_PAGE = 20;

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscount, setFormDiscount] = useState("");
  const [formDiscountType, setFormDiscountType] =
    useState<DiscountType>("PERCENTAGE");
  const [formCategory, setFormCategory] = useState<CategoryType>("ALL");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotions", search, activeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (activeFilter !== "ALL")
        params.append("isActive", activeFilter === "true" ? "true" : "false");
      params.append("page", String(page));
      params.append("limit", String(ITEMS_PER_PAGE));
      const { data } = await api.get(`/admin/promotions?${params}`);
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/admin/promotions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      resetForm();
      setShowCreateModal(false);
      toast.success("Promotion created");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create promotion");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const { data } = await api.patch(`/admin/promotions/${id}`, {
        isActive: !isActive,
      });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success(
        vars.isActive ? "Promotion deactivated" : "Promotion activated"
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to update promotion"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/promotions/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      setDeleteTarget(null);
      toast.success("Promotion deleted");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to delete promotion"
      );
    },
  });

  const promotions: Promotion[] = data?.promotions || [];
  const totalPages: number = data?.totalPages || 1;

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormDiscount("");
    setFormDiscountType("PERCENTAGE");
    setFormCategory("ALL");
    setFormStartDate("");
    setFormEndDate("");
    setFormImage(null);
    setFormImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setFormImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setFormImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formDiscount || Number(formDiscount) <= 0) {
      toast.error("Discount must be greater than 0");
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(formStartDate) >= new Date(formEndDate)) {
      toast.error("End date must be after start date");
      return;
    }

    const formData = new FormData();
    formData.append("title", formTitle.trim());
    formData.append("description", formDescription.trim());
    formData.append("discount", formDiscount);
    formData.append("discountType", formDiscountType);
    formData.append("category", formCategory);
    formData.append("startDate", formStartDate);
    formData.append("endDate", formEndDate);
    if (formImage) {
      formData.append("image", formImage);
    }

    createMutation.mutate(formData);
  };

  const formatDiscount = (discount: number, discountType: string) => {
    if (discountType === "PERCENTAGE") {
      return `${discount}%`;
    }
    return `GH₵${discount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6" /> Promotions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage promotional campaigns and discounts
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Promotion
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search promotions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Status:
          </span>
          <div className="flex gap-1">
            {["ALL", "true", "false"].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setActiveFilter(v);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeFilter === v
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {v === "ALL" ? "All" : v === "true" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
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
        ) : promotions.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No promotions found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">
                    Title
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    Discount
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    Category
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    Date Range
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">
                    Active
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr
                    key={promo.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {promo.image ? (
                          <img
                            src={promo.image}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <Megaphone className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                            {promo.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">
                            {promo.description?.slice(0, 50) || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {formatDiscount(promo.discount, promo.discountType)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          CATEGORY_STYLES[promo.category] || CATEGORY_STYLES.OTHER
                        }`}
                      >
                        {promo.category?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {formatDate(promo.startDate)} –{" "}
                          {formatDate(promo.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: promo.id,
                            isActive: promo.isActive,
                          })
                        }
                        disabled={toggleMutation.isPending}
                        className="focus:outline-none"
                      >
                        {promo.isActive ? (
                          <ToggleRight className="w-7 h-7 text-green-500 hover:text-green-600 transition" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-gray-400 hover:text-gray-500 transition" />
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
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(false);
              }}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-6">
              New Promotion
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Title *
                </label>
                <Input
                  type="text"
                  placeholder="Promotion title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe the promotion..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Discount *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 15"
                    min="0"
                    step="0.01"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Discount Type *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormDiscountType("PERCENTAGE")}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition ${
                        formDiscountType === "PERCENTAGE"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDiscountType("FIXED")}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition ${
                        formDiscountType === "FIXED"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      GH₵ Fixed
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Category
                </label>
                <div className="flex gap-1 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        formCategory === c
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {c === "ALL" ? "All" : c.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Image
                </label>
                {formImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={formImagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormImage(null);
                        setFormImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition">
                    <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Click to upload
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Max 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Promotion"
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
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                  Delete Promotion
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.title}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Promotion"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
