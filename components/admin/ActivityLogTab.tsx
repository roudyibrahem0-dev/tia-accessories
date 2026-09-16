'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAdminActivityLog } from '@/lib/admin';
import { Badge, Panel } from './ui';

type ActivityRow = {
  id: number;
  action: string;
  details: string;
  created_at?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
};

const activityFilters = [
  'الكل',
  'إضافة مدير',
  'إضافة قطعة',
  'تحديث قطعة',
  'حذف قطعة',
  'تغيير حالة القطعة',
  'إضافة مخزون إكسسوارات',
  'تحديث مخزون الإكسسوارات',
  'حذف من مخزون الإكسسوارات',
  'إنشاء طلب يدوي',
  'تحديث حالة الطلب',
  'تسجيل الدفع',
  'إنشاء كود خصم',
  'تغيير حالة الكوبون',
  'حذف كوبون',
  'إضافة تصنيف',
  'تعديل تصنيف',
  'حذف تصنيف',
];

export function ActivityLogTab() {
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const { data, error } = await fetchAdminActivityLog(80);
      if (!error) setLogs(data as ActivityRow[]);
      setLoading(false);
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (filter === 'الكل') return logs;
    return logs.filter((log) => log.action === filter);
  }, [filter, logs]);

  return (
    <Panel title="تاريخ النشاطات">
      <div className="mb-4 flex flex-wrap gap-2">
        {activityFilters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              filter === item
                ? 'border-copper bg-copper/15 text-copper-bright'
                : 'border-border-copper bg-[#0e0e14] text-muted hover:text-copper-bright'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">جاري تحميل سجل النشاطات...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-muted">لا توجد نشاطات مسجلة بعد للفئة المحددة.</p>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-border-copper/50 bg-[#121218] p-4 shadow-[0_0_0_1px_rgba(193,140,86,0.15)]">
              <div className="mb-3 flex flex-col gap-3 border-b border-border-copper/30 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-copper/60 bg-copper/10 text-sm font-black text-copper-bright">
                    {String(log.admin_name ?? 'ن').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{log.admin_name || 'النظام'}</p>
                    <p className="text-[11px] text-muted">{log.admin_email || 'system'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="copper">{log.action}</Badge>
                  <span className="text-[11px] text-muted">
                    {log.created_at ? new Date(log.created_at).toLocaleString('ar') : '—'}
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-200">{log.details}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
