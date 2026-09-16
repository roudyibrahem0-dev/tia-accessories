'use client';

import { useEffect, useState } from 'react';
import { fetchAdminActivityLog } from '@/lib/admin';
import { ActivityLogTab } from './ActivityLogTab';

type ActivityRow = {
  id: number;
  action: string;
  details: string;
  created_at?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
};

export function ActivityLogCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCount, setRecentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentLogs = async () => {
      setLoading(true);
      const { data, error } = await fetchAdminActivityLog(3);
      if (!error) {
        setRecentCount((data as ActivityRow[]).length);
      }
      setLoading(false);
    };

    loadRecentLogs();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group rounded-2xl border border-border-copper/60 bg-[#121218] p-4 transition hover:border-copper hover:bg-[#161620] shadow-[0_0_0_1px_rgba(193,140,86,0.08)]"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-copper-bright">سجل النشاطات</h3>
          <svg
            className="h-5 w-5 text-muted transition group-hover:text-copper-bright"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-xs text-muted">
          {loading ? 'جاري التحميل...' : `آخر ${recentCount} أحداث`}
        </p>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border-copper/60 bg-[#0a0a0c] shadow-2xl" dir="rtl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-copper/60 bg-[#121218] p-6">
              <h2 className="text-xl font-black text-copper-bright">سجل النشاطات الكامل</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-border-copper bg-[#0e0e14] p-2 text-muted transition hover:border-copper hover:text-copper-bright"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ActivityLogTab />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
