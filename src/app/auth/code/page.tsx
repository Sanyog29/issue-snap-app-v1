'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCodePage() {
  const router = useRouter();

  useEffect(() => {
    // Phone/Email OTP has been replaced with 1-click OAuth
    router.replace('/auth');
  }, [router]);

  return null;
}
