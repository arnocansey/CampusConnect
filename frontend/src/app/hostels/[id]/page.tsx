"use client";

import { HostelDetailPage } from '@/screens/HostelDetailPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HostelDetailPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
