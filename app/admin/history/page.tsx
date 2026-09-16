'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { money } from '@/lib/pricing';
import { Badge, Panel, StatCard } from '@/components/admin/ui';
import { formatMonthLabel } from '@/lib/admin';

type MonthlyArchive = {
  id: number;
  month_year: string;
  total_sales: number;
  total_orders: number;
  archived_at: string;
};

function formatMonth(month: string) {
  return formatMonthLabel(month);
}

export default function HistoryPage() {
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loadingArchives, setLoadingArchives] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArchives() {
      const { data, error: archiveError } = await supabase
        .from('monthly_archives')
        .select('*')
        .order('month_year', { ascending: false });

      if (archiveError) {
        setError('تعذر تحميل الأرشيف. تأكد من تنفيذ Migration الأرشيف وتسجيل الدخول كأدمن.');
      } else {
        const list = (data || []) as MonthlyArchive[];
        setArchives(list);
        if (list[0]) setSelectedMonth(list[0].month_year);
      }
      setLoadingArchives(false);
    }

    loadArchives();
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
      setOrders([]);
      return;
    }

    async function loadOrders() {
      setLoadingOrders(true);
      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('archived_month', selectedMonth)
        .order('created_at', { ascending: false });

      if (ordersError) setError('تعذر تحميل طلبات الشهر المحدد.');
      else setOrders((data || []) as Order[]);
      setLoadingOrders(false);
    }

    loadOrders();
  }, [selectedMonth]);

  const selectedArchive = archives.find((archive) => archive.month_year === selectedMonth);
  const displayedSales = selectedArchive?.total_sales ?? orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const displayedOrders = selectedArchive?.total_orders ?? orders.length;

  return (
    <div className="circuit-bg min-h-screen text-white" dir="rtl">
      <header className="border-b border-border-copper/60 bg-[#0a0a0c]/92 px-4 py-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-copper-bright">الأرشيف الشهري</h1>
            <p className="text-xs text-muted">سجل الطلبات والإحصائيات للأشهر السابقة</p>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-border-copper px-4 py-2 text-sm text-muted transition hover:border-copper hover:text-copper-bright"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {error ? <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

        <Panel title="الأشهر المؤرشفة">
          {loadingArchives ? (
            <p className="text-sm text-muted">جاري تحميل الأشهر...</p>
          ) : archives.length === 0 ? (
            <p className="text-sm text-muted">لا توجد أشهر مؤرشفة بعد.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {archives.map((archive) => (
                <Link
                  key={archive.id}
                  href={`/admin?month=${encodeURIComponent(archive.month_year)}`}
                  className={`block rounded-2xl border p-4 text-right transition ${
                    selectedMonth === archive.month_year
                      ? 'border-copper bg-copper/10'
                      : 'border-border-copper bg-[#0e0e14] hover:border-copper/60'
                  }`}
                >
                  <p className="font-black text-copper-bright">{formatMonth(archive.month_year)}</p>
                  <p className="mt-2 text-sm text-muted">{archive.total_orders} طلب</p>
                  <p className="mt-1 text-sm font-bold text-white">{money(Number(archive.total_sales || 0))}</p>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        {selectedMonth ? (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <StatCard label="إجمالي مبيعات الشهر" value={money(Number(displayedSales || 0))} hint={formatMonth(selectedMonth)} />
              <StatCard label="عدد طلبات الشهر" value={displayedOrders} hint="طلبات مؤرشفة" />
            </div>

            <Panel title={`طلبات ${formatMonth(selectedMonth)}`}>
              {loadingOrders ? (
                <p className="text-sm text-muted">جاري تحميل الطلبات...</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted">لا توجد طلبات محفوظة لهذا الشهر.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-border-copper bg-[#0e0e14] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-white">طلب #{order.order_number ?? order.id}</h3>
                          <p className="mt-1 text-sm text-muted">{order.customer_name || 'زبون بدون اسم'} · {order.customer_phone}</p>
                          <p className="mt-1 text-xs text-muted">{order.created_at ? new Date(order.created_at).toLocaleString('ar') : '—'}</p>
                        </div>
                        <div className="text-left">
                          <Badge tone={order.status === 'paid' ? 'green' : 'copper'}>{order.status}</Badge>
                          <p className="mt-2 font-black text-copper-bright">{money(Number(order.total_price || 0))}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted">{order.customer_location}</p>
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </>
        ) : null}
      </main>
    </div>
  );
}