'use client';

import { use } from 'react';
import PublicTrackingPage from '@/app/track/[token]/page';

export default function MyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  // Re-use tracking page component directly with ID
  return <PublicTrackingPage params={Promise.resolve({ token: resolved.id })} />;
}
