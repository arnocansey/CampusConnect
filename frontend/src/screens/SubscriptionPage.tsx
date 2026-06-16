"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Crown, Zap, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  adLimit: number;
  durationDays: number;
}

export function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('payment') === 'success';
  const paymentRef = searchParams.get('ref');
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);

  const { data: plans = [], isLoading, error: plansError } = useQuery<Plan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/plans');
      return data.data;
    },
  });

  const { data: mySub } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/my-subscription');
      return data.data;
    },
  });

  const initPayment = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post('/subscriptions/initialize', { planId });
      return data.data;
    },
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    },
  });

  // Verify payment if redirected back
  const verifyMutation = useMutation({
    mutationFn: async (ref: string) => {
      const { data } = await api.get(`/subscriptions/verify/${ref}`);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Payment verified! Your subscription is now active.');
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      router.replace('/subscriptions');
    },
    onError: () => {
      toast.error('Payment verification failed. Please contact support.');
      router.replace('/subscriptions');
    },
  });

  // Auto-verify on redirect
  useEffect(() => {
    if (paymentSuccess && paymentRef && !verifying) {
      setVerifying(true);
      verifyMutation.mutate(paymentRef);
    }
  }, [paymentSuccess, paymentRef]);

  const getPlanIcon = (name: string) => {
    if (name.toLowerCase().includes('free')) return <Zap className="w-6 h-6" />;
    if (name.toLowerCase().includes('business')) return <Crown className="w-6 h-6" />;
    return <Star className="w-6 h-6" />;
  };

  const getAdDisplay = (limit: number) => (limit === -1 ? 'Unlimited' : limit.toString());

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 md:pb-4">
      <div className="mb-6">
        <Link href="/marketplace" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose a plan to start selling on CampusConnect</p>
      </div>

      {/* Active subscription banner */}
      {mySub && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-green-800 dark:text-green-300">
                Active: {mySub.plan.name}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {mySub.adsRemaining === -1 ? 'Unlimited ads' : `${mySub.adsRemaining} ads remaining`} · Expires {new Date(mySub.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {verifying && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Verifying your payment...</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-4" />
            </div>
          ))}
        </div>
      ) : plansError ? (
        <div className="text-center py-12 text-red-500">
          <p>Failed to load plans. Please try again.</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No subscription plans available yet.</p>
          <p className="text-sm mt-1">Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan, index) => {
            const isPopular = index === 1;
            const isFree = plan.price === 0;

            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-6 transition ${
                  isPopular
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                {isPopular && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                    MOST POPULAR
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isPopular ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {getPlanIcon(plan.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold dark:text-white">
                      {isFree ? 'Free' : `GH₵${plan.price}`}
                    </p>
                    {!isFree && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">/{plan.durationDays} days</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    {getAdDisplay(plan.adLimit)} ads
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    {plan.durationDays} days
                  </span>
                </div>

                <Button
                  className={`w-full mt-4 ${isPopular ? '' : 'variant-outline'}`}
                  variant={isPopular ? 'default' : 'outline'}
                  disabled={mySub?.planId === plan.id && mySub?.status === 'ACTIVE'}
                  onClick={() => {
                    if (isFree) {
                      initPayment.mutate(plan.id);
                    } else {
                      initPayment.mutate(plan.id);
                    }
                  }}
                >
                  {mySub?.planId === plan.id && mySub?.status === 'ACTIVE'
                    ? 'Current Plan'
                    : isFree
                    ? 'Get Started'
                    : 'Subscribe Now'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
