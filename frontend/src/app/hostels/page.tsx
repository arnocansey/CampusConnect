"use client";

import { HostelPage } from '@/screens/HostelPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HostelPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
