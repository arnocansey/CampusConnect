"use client";

import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';
import { SubscriptionPage } from '@/screens/SubscriptionPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <SubscriptionPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
