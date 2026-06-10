"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LandingPage } from '@/screens/LandingPage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <LoadingSpinner />;
  }

  return <LandingPage />;
}
