"use client";

import { JobDetailPage } from '@/screens/JobDetailPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <JobDetailPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
