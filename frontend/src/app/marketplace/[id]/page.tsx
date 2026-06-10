"use client";

import { MarketplaceDetailPage } from '@/screens/MarketplaceDetailPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <MarketplaceDetailPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
