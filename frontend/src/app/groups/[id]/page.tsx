"use client";

import { GroupDetailPage } from '@/screens/GroupDetailPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <GroupDetailPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
