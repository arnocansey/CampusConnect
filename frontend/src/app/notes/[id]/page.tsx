"use client";

import { NoteDetailPage } from '@/screens/NoteDetailPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <NoteDetailPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
