"use client";

import { MarketplacePage } from '@/screens/MarketplacePage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <MarketplacePage />
      </MainLayout>
    </ProtectedRoute>
  );
}
