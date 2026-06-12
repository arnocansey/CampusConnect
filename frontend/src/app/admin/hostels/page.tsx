"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Search, MapPin, CheckCircle, Trash2, Shield, Star } from "lucide-react";
import toast from "react-hot-toast";

interface Hostel {
  id: string;
  name: string;
  location: string;
  pricePerMonth: number;
  currency: string;
  averageRating: number;
  isApproved: boolean;
  createdAt: string;
  roomType: string;
}

function formatPrice(price: number, currency: string) {
  const symbol =
    currency === "GHS"
      ? "GH\u20B5"
      : currency === "USD"
        ? "$"
        : currency === "NGN"
          ? "\u20A6"
          : currency + " ";
  return `${symbol}${price.toLocaleString()}`;
}

export default function AdminHostelsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-hostels", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const { data } = await api.get(`/admin/hostels?${params}`);
      return data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/hostels/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hostels"] });
      toast.success("Hostel approved");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to approve hostel");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/hostels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hostels"] });
      toast.success("Hostel deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete hostel");
    },
  });

  const hostels: Hostel[] = data?.hostels ?? [];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin — Hostels
        </h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Review and manage hostel listings
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-2 mb-6 transition-colors">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search hostels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : hostels.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hostels found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                    Approved
                  </th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {hostels.map((hostel) => (
                  <tr
                    key={hostel.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {hostel.name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {hostel.roomType?.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-3.5 h-3.5" />
                        {hostel.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {formatPrice(hostel.pricePerMonth, hostel.currency || "GHS")}
                      <span className="text-gray-400 dark:text-gray-500 font-normal">
                        /mo
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {hostel.averageRating?.toFixed(1) ?? "0.0"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hostel.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!hostel.isApproved && (
                          <button
                            onClick={() => approveMutation.mutate(hostel.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                            title="Approve"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Delete this hostel?")) {
                              deleteMutation.mutate(hostel.id);
                            }
                          }}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition"
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
        </div>
      )}
    </div>
  );
}
