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

const planBenefits: Record<string, string[]> = {
  'Free': [
    'Access core social networking features',
    'Standard search visibility',
    'Up to 2 marketplace listings',
    'Standard notes downloads'
  ],
  'Basic': [
    'Access core social networking features',
    'Standard search visibility',
    'Up to 15 marketplace listings',
    'Standard notes downloads'
  ],
  'Student Premium': [
    'Profile Verification Badge',
    'Priority Appearance in Search Results',
    'Content Boosting (posts, listings, groups)',
    'Featured Stories Placement',
    'Unlimited Notes Uploads',
    'Ad-Free Experience',
    'AI-Powered Study Recommendations',
    'AI Note Summaries'
  ],
  'Pro': [
    'Unlimited Listings',
    'Featured Products',
    'Advanced Sales Analytics',
    'Priority Search Ranking'
  ],
  'Pro Seller': [
    'Unlimited Listings',
    'Featured Store Profile & Products',
    'Advanced Sales Analytics',
    'Verified Seller Badge',
    'Multiple Product Images',
    'Customer Insights Dashboard'
  ],
  'Business': [
    'Unlimited Listings & Dedicated Storefront',
    'Sales Performance Reports & Tools',
    'Priority Customer Support'
  ],
  'Business Seller': [
    'Business Verification Badge',
    'Dedicated Storefront Page',
    'Bulk Product Upload Tools',
    'Sponsored Listings Campaigns',
    'Sales Performance Reports & Tools',
    'Priority Customer Support'
  ],
  'Premium Hostel Partner': [
    'Featured Hostel Placement',
    'Homepage Promotion & Exposure',
    'Verified Hostel Badge',
    'Booking Analytics & Occupancy Reports',
    'Student Engagement Insights',
    'Promotional Campaign Tools'
  ],
  'Recruiter Premium': [
    'Featured Job Listings',
    'Employer Verification Badge',
    'Priority Candidate Search',
    'Unlimited Internship Listings',
    'Access to Resume Database',
    'Recruitment Analytics Dashboard'
  ]
};

export function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('payment') === 'success';
  const paymentRef = searchParams.get('ref');
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'seller' | 'partner'>('student');

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
    const lowerName = name.toLowerCase();
    if (lowerName.includes('free')) return <Zap className="w-6 h-6" />;
    if (lowerName.includes('business')) return <Crown className="w-6 h-6" />;
    if (lowerName.includes('premium') || lowerName.includes('recruiter') || lowerName.includes('partner')) return <Crown className="w-6 h-6 text-yellow-500" />;
    return <Star className="w-6 h-6 text-blue-500" />;
  };

  const getAdDisplay = (limit: number) => (limit === -1 ? 'Unlimited' : limit.toString());

  const filteredPlans = plans.filter(plan => {
    const name = plan.name;
    if (activeTab === 'student') {
      return name === 'Free' || name === 'Student Premium' || name === 'Basic';
    }
    if (activeTab === 'seller') {
      return name === 'Pro Seller' || name === 'Business Seller' || name === 'Pro' || name === 'Business';
    }
    if (activeTab === 'partner') {
      return name === 'Premium Hostel Partner' || name === 'Recruiter Premium';
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 md:pb-4">
      <div className="mb-6">
        <Link href="/marketplace" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Upgrade your account to unlock premium features and visibility</p>
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
                Active Plan: {mySub.plan.name}
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

      {/* Category Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('student')}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition ${
            activeTab === 'student'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-800'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          🎓 Students
        </button>
        <button
          onClick={() => setActiveTab('seller')}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition ${
            activeTab === 'seller'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-800'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          🛒 Sellers
        </button>
        <button
          onClick={() => setActiveTab('partner')}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition ${
            activeTab === 'partner'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-800'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          💼 Partners & Recruiters
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
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
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <p>No subscription plans available in this category yet.</p>
          <p className="text-sm mt-1 text-gray-400">Run database seeds to import these packages!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => {
            const isPopular = plan.name === 'Student Premium' || plan.name === 'Pro Seller' || plan.name === 'Premium Hostel Partner';
            const isFree = plan.price === 0;

            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-6 flex flex-col justify-between transition ${
                  isPopular
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div>
                  {isPopular && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 inline-block uppercase tracking-wider">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isPopular ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white leading-tight">{plan.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pb-4 border-b border-gray-100 dark:border-gray-800/80">
                    <span className="text-3xl font-extrabold dark:text-white">
                      {isFree ? 'Free' : `GH₵${plan.price}`}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/{plan.durationDays} days</span>
                    )}
                  </div>

                  {/* Benefits checklist */}
                  <div className="mt-5 space-y-2.5">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Features & Benefits:</p>
                    {(planBenefits[plan.name] || [
                      `${getAdDisplay(plan.adLimit)} active listings`,
                      `Valid for ${plan.durationDays} days`
                    ]).map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className={`w-full mt-6 ${isPopular ? '' : 'variant-outline'}`}
                  variant={isPopular ? 'default' : 'outline'}
                  disabled={mySub?.planId === plan.id && mySub?.status === 'ACTIVE'}
                  onClick={() => initPayment.mutate(plan.id)}
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
