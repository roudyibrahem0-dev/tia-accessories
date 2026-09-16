import Link from 'next/link';
import { UsersRound } from 'lucide-react';

export type AdminTab = 'overview' | 'products' | 'add-admin' | 'categories' | 'orders' | 'customers' | 'inventory' | 'coupons';

export const adminTabs: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'products', label: 'القطع' },
  { id: 'add-admin', label: 'إضافة مدير' },
  { id: 'categories', label: 'أفضل المنتجات' },
  { id: 'orders', label: 'الطلبات' },
  { id: 'customers', label: 'العملاء' },
  { id: 'inventory', label: 'المخزون' },
  { id: 'coupons', label: 'الخصومات' },
];

type AdminHeaderProps = {
  activeTab: AdminTab;
  productsCount: number;
  ordersCount: number;
  customersCount: number;
  couponsCount: number;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
};

export function AdminHeader({
  activeTab,
  productsCount,
  ordersCount,
  customersCount,
  couponsCount,
  onTabChange,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#702765]/10 bg-[#ead3e6]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <div>
          <h1 className="text-lg font-black tracking-wide text-[#351330] sm:text-xl">لوحة تحكم Tia Accessories</h1>
          <p className="text-xs text-muted">إدارة القطع · الطلبات · المخزون · الخصومات</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 rounded-full border border-[#702765]/20 px-3 py-2 text-xs text-[#351330] transition hover:border-copper hover:text-copper-bright sm:flex-none sm:px-4 sm:text-sm"
          >
            تسجيل الخروج
          </button>
          <Link
            href="/"
            className="flex-1 rounded-full border border-[#702765]/20 px-3 py-2 text-xs text-[#351330] transition hover:border-copper hover:text-copper-bright sm:flex-none sm:px-4 sm:text-sm"
          >
            عرض المتجر
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:px-6">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.id
                ? 'copper-btn'
                : 'border border-[#702765]/15 bg-white/70 text-[#756574] hover:text-copper-bright'
            }`}
          >
            {tab.id === 'customers' ? <UsersRound className="ml-1 inline-block size-4" aria-hidden="true" /> : null}
            {tab.label}
            {tab.id === 'products' ? ` (${productsCount})` : ''}
            {tab.id === 'orders' ? ` (${ordersCount})` : ''}
            {tab.id === 'customers' ? ` (${customersCount})` : ''}
            {tab.id === 'coupons' ? ` (${couponsCount})` : ''}
          </button>
        ))}
        <Link
          href="/admin/history"
          className="whitespace-nowrap rounded-full border border-[#702765]/15 bg-white/70 px-4 py-2 text-sm font-bold text-[#756574] transition hover:border-copper hover:text-copper-bright"
        >
          الأرشيف الشهري
        </Link>
      </div>
    </header>
  );
}
