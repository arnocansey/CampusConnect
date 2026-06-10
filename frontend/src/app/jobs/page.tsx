"use client";

import { JobsPage } from '@/screens/JobsPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <JobsPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
