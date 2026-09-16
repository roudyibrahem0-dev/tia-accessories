'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="circuit-bg flex min-h-screen items-center justify-center text-muted" dir="rtl">
      جاري التحويل إلى لوحة التحكم...
    </div>
  );
}
