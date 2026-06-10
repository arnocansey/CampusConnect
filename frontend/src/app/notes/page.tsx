"use client";

import { NotesPage } from '@/screens/NotesPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <NotesPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
