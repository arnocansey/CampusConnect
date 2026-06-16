"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  adLimit: number;
  durationDays: number;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, adLimit: 10, durationDays: 30 });

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['adminPlans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/admin/plans');
      return data.data;
    },
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      if (editingPlan) {
        await api.put(`/subscriptions/admin/plans/${editingPlan.id}`, form);
      } else {
        await api.post('/subscriptions/admin/plans', form);
      }
    },
    onSuccess: () => {
      toast.success(editingPlan ? 'Plan updated' : 'Plan created');
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      setShowModal(false);
      setEditingPlan(null);
      setForm({ name: '', description: '', price: 0, adLimit: 10, durationDays: 30 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => await api.delete(`/subscriptions/admin/plans/${id}`),
    onSuccess: () => {
      toast.success('Plan deleted');
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const togglePlan = useMutation({
    mutationFn: async (id: string) => await api.patch(`/subscriptions/admin/plans/${id}/toggle`),
    onSuccess: (res) => {
      toast.success(`Plan ${res.data.data.isActive ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({ name: plan.name, description: plan.description || '', price: plan.price, adLimit: plan.adLimit, durationDays: plan.durationDays });
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Subscription Plans</h1>
        </div>
        <Button size="sm" onClick={() => { setEditingPlan(null); setForm({ name: '', description: '', price: 0, adLimit: 10, durationDays: 30 }); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{plan.name}</h3>
                  {plan.description && <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePlan.mutate(plan.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title={plan.isActive ? 'Deactivate' : 'Activate'}>
                    {plan.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(plan)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this plan?')) deletePlan.mutate(plan.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Price: GH₵{plan.price}</span>
                <span>Ads: {plan.adLimit === -1 ? 'Unlimited' : plan.adLimit}</span>
                <span>Duration: {plan.durationDays}d</span>
              </div>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold dark:text-white">{editingPlan ? 'Edit Plan' : 'Add Plan'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Price (GH₵)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Duration (days)</label>
                  <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 30 })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Ad Limit (-1 = unlimited)</label>
                <input type="number" value={form.adLimit} onChange={(e) => setForm({ ...form, adLimit: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm" />
              </div>
              <Button className="w-full" onClick={() => savePlan.mutate()} disabled={savePlan.isPending || !form.name}>
                {savePlan.isPending ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
