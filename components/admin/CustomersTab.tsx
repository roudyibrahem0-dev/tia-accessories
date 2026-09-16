'use client';

import { useDeferredValue, useState } from 'react';
import { money } from '@/lib/pricing';
import type { Customer, Order, OrderStatus } from '@/lib/types';
import { Badge, Panel, StatCard, TextInput } from './ui';

type Props = {
  customers: Customer[];
  loading: boolean;
};

const statusLabels: Record<OrderStatus, string> = {
  draft: 'مسودة',
  pending: 'قيد الانتظار',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  pending_payment: 'قيد الدفع',
  paid: 'تم الدفع',
  cancelled: 'ملغي',
};

const statusTones: Record<OrderStatus, 'amber' | 'copper' | 'green' | 'red' | 'slate'> = {
  draft: 'slate',
  pending: 'amber',
  processing: 'copper',
  shipped: 'green',
  delivered: 'green',
  pending_payment: 'amber',
  paid: 'green',
  cancelled: 'red',
};

function formatDate(value?: string | null) {
  if (!value) return 'غير متوفر';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
}

function getCustomerTotal(orders: Order[]) {
  return orders
    .filter((order) => order.status !== 'cancelled' && order.status !== 'draft')
    .reduce((total, order) => total + Number(order.total_price || 0), 0);
}

function getOrderItems(order: Order) {
  return (order.items ?? []).map((item) => `${item.name} x${item.quantity ?? 1}`).join('، ') || 'لا توجد عناصر مسجلة';
}

export function CustomersTab({ customers, loading }: Props) {
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('ar'));

  const filteredCustomers = customers.filter((customer) => {
    if (!deferredQuery) return true;
    const orders = customer.orders ?? [];
    return (
      customer.name.toLocaleLowerCase('ar').includes(deferredQuery) ||
      customer.phone.toLocaleLowerCase('ar').includes(deferredQuery) ||
      orders.some((order) => String(order.order_number ?? order.id).includes(deferredQuery) || String(order.id).includes(deferredQuery))
    );
  });

  const orderCount = customers.reduce((total, customer) => total + (customer.orders?.length ?? 0), 0);
  const totalSpent = customers.reduce((total, customer) => total + getCustomerTotal(customer.orders ?? []), 0);

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي العملاء" value={customers.length} />
        <StatCard label="إجمالي الطلبات" value={orderCount} />
        <StatCard label="إجمالي الإنفاق" value={money(totalSpent)} />
      </div>

      <Panel title="قاعدة بيانات العملاء">
        <div className="mb-5">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف أو رقم الطلب"
            aria-label="البحث عن عميل"
          />
        </div>

        {loading ? <p className="py-10 text-center text-sm text-muted">جاري تحميل العملاء...</p> : null}
        {!loading && filteredCustomers.length === 0 ? <p className="py-10 text-center text-sm text-muted">لا توجد نتائج مطابقة للبحث.</p> : null}
        {!loading && filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="border-b border-border-copper text-xs text-muted">
                <tr>
                  <th className="px-3 py-3 font-medium">العميل</th>
                  <th className="px-3 py-3 font-medium">الهاتف</th>
                  <th className="px-3 py-3 font-medium">عدد الطلبات</th>
                  <th className="px-3 py-3 font-medium">إجمالي الإنفاق</th>
                  <th className="px-3 py-3 font-medium">تاريخ التسجيل</th>
                  <th className="px-3 py-3 font-medium">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const orders = customer.orders ?? [];
                  return (
                    <tr key={customer.id} className="border-b border-border-copper/30 last:border-0">
                      <td className="px-3 py-4 font-bold text-white">{customer.name}</td>
                      <td className="px-3 py-4 text-muted" dir="ltr">{customer.phone}</td>
                      <td className="px-3 py-4 text-white">{orders.length}</td>
                      <td className="px-3 py-4 font-bold text-copper-bright">{money(getCustomerTotal(orders))}</td>
                      <td className="px-3 py-4 text-muted">{formatDate(customer.created_at)}</td>
                      <td className="px-3 py-4">
                        <button type="button" onClick={() => setSelectedCustomer(customer)} className="text-sm font-bold text-copper-bright hover:text-white">
                          عرض الملف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>

      {selectedCustomer ? (
        <CustomerDetails customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      ) : null}
    </div>
  );
}

function CustomerDetails({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const orders = customer.orders ?? [];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70" role="dialog" aria-modal="true" aria-label={`ملف العميل ${customer.name}`}>
      <button type="button" onClick={onClose} className="absolute inset-0 cursor-default" aria-label="إغلاق ملف العميل" />
      <section className="relative h-full w-full max-w-2xl overflow-y-auto border-r border-border-copper bg-[#101015] p-5 shadow-2xl sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted">ملف العميل</p>
            <h2 className="mt-1 text-2xl font-black text-copper-bright">{customer.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-border-copper px-3 py-1.5 text-sm text-muted hover:text-white">إغلاق</button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border-copper/50 bg-[#0e0e14] p-4 text-sm"><p className="text-xs text-muted">رقم الهاتف</p><p className="mt-1 text-white" dir="ltr">{customer.phone}</p></div>
          <div className="rounded-xl border border-border-copper/50 bg-[#0e0e14] p-4 text-sm"><p className="text-xs text-muted">البريد الإلكتروني</p><p className="mt-1 text-white" dir="ltr">{customer.email || 'غير مسجل'}</p></div>
          <div className="rounded-xl border border-border-copper/50 bg-[#0e0e14] p-4 text-sm sm:col-span-2"><p className="text-xs text-muted">العنوان</p><p className="mt-1 whitespace-pre-line text-white">{customer.address || 'غير مسجل'}</p></div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <StatCard label="إجمالي الطلبات" value={orders.length} />
          <StatCard label="إجمالي الإنفاق" value={money(getCustomerTotal(orders))} />
        </div>

        <h3 className="mb-3 text-base font-bold text-copper-bright">سجل الطلبات</h3>
        <div className="space-y-3">
          {orders.length === 0 ? <p className="text-sm text-muted">لا توجد طلبات لهذا العميل.</p> : null}
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-border-copper/50 bg-[#0e0e14] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-white">طلب #{order.order_number ?? order.id}</p>
                <Badge tone={statusTones[order.status]}>{statusLabels[order.status]}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted">{formatDate(order.created_at)}</p>
              <p className="mt-3 text-sm text-muted">{getOrderItems(order)}</p>
              <p className="mt-3 font-black text-copper-bright">{money(Number(order.total_price || 0))}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}