"use client";

import { useParams } from 'next/navigation';
import { HashtagPage } from '@/screens/HashtagPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  const params = useParams();
  const tag = params.tag as string;

  return (
    <ProtectedRoute>
      <MainLayout>
        <HashtagPage tag={tag} />
      </MainLayout>
    </ProtectedRoute>
  );
}
