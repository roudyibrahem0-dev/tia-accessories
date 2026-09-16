'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AddAdminCard } from '@/components/admin/AddAdminCard';
import { AdminHeader, type AdminTab } from '@/components/admin/AdminHeader';
import { AdminLoginCard } from '@/components/admin/AdminLoginCard';
import { ActivityLogCard } from '@/components/admin/ActivityLogCard';
import { CategoriesTab } from '@/components/admin/CategoriesTab';
import { CouponsTab } from '@/components/admin/CouponsTab';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { InventoryTab } from '@/components/admin/InventoryTab';
import { OrdersTab } from '@/components/admin/OrdersTab';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { ProductsTab } from '@/components/admin/ProductsTab';
import { fetchAdminDashboardData, fetchCustomers, formatMonthLabel, logAdminActivity, signInAdmin, signOutAdmin, signUpAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import type { Coupon, Customer, GeneralInventoryItem, Order, Product } from '@/lib/types';

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archiveMonth = searchParams.get('month');

  const [activeTab, setActiveTab] = useState<AdminTab>('add-admin');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [generalInventory, setGeneralInventory] = useState<GeneralInventoryItem[]>([]);
  const [couponsReady, setCouponsReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || '');
      }
      setIsAuthLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || '');
      } else {
        setIsLoggedIn(false);
        setCurrentUserEmail('');
      }
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const archiveLabel = useMemo(() => {
    if (!archiveMonth) return null;
    return formatMonthLabel(archiveMonth);
  }, [archiveMonth]);

  const fetchAllData = useCallback(async (month?: string | null) => {
    setLoading(true);

    const data = await fetchAdminDashboardData(month);

    setProducts((data.products || []) as Product[]);
    setOrders((data.orders || []) as Order[]);
    setGeneralInventory((data.generalInventory || []) as GeneralInventoryItem[]);
    setCouponsReady(data.couponsReady);
    setCoupons((data.coupons || []) as Coupon[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData(archiveMonth);
    }
  }, [fetchAllData, isLoggedIn, archiveMonth]);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    const { data, error } = await fetchCustomers();
    if (error) {
      console.error('Customer dashboard query failed:', error.message);
    }
    setCustomers(data);
    setCustomersLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'customers') {
      loadCustomers();
    }
  }, [activeTab, isLoggedIn, loadCustomers]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');

    const { error } = await signInAdmin(email, password);

    if (error) {
      setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  const handleAddAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminMessage('');

    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminMessage('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsAddingAdmin(true);

    const { error } = await signUpAdmin(newAdminEmail, newAdminPassword);

    setIsAddingAdmin(false);

    if (error) {
      setAdminMessage('خطأ في إضافة المدير: ' + error.message);
      await logAdminActivity('إضافة مدير', `فشل إنشاء حساب جديد: ${newAdminEmail.trim()} | ${error.message}`);
    } else {
      setAdminMessage('تم إضافة الحساب بنجاح! يمكنه الآن تسجيل الدخول.');
      setNewAdminEmail('');
      setNewAdminPassword('');
      await logAdminActivity('إضافة مدير', `تم إنشاء مدير جديد: ${newAdminEmail.trim()}`);
    }
  };

  const handleActivityLog = useCallback(async (action: string, details: string) => {
    await logAdminActivity(action, details);
  }, []);

  const handleLogout = async () => {
    await signOutAdmin();
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  if (isAuthLoading) {
    return (
      <div className="circuit-bg flex min-h-screen items-center justify-center p-6" dir="rtl">
        <p className="text-sm text-muted">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="admin-shell circuit-bg min-h-screen" dir="rtl">
      <AdminHeader
        activeTab={activeTab}
        productsCount={products.length}
        ordersCount={orders.length}
        customersCount={customers.length}
        couponsCount={coupons.length}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {!archiveMonth && activeTab === 'overview' && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <ActivityLogCard />
          </div>
        )}

        {archiveMonth ? (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-copper/40 bg-copper/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-copper">ARCHIVE MODE</p>
              <p className="text-base font-black text-copper-bright">وضع الأرشيف لشهر {archiveLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-full border border-border-copper bg-[#121218] px-4 py-2 text-sm text-white transition hover:border-copper hover:text-copper-bright"
            >
              العودة إلى الشهر الحالي
            </button>
          </div>
        ) : null}

        {!couponsReady && activeTab !== 'add-admin' ? (
          <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-50">
            لتفعيل الوصف، تفاصيل القطعة، الخصومات، والكوبونات بالكامل: افتح Supabase → SQL Editor ونفّذ
            ملف <code className="text-copper-bright">supabase/schema.sql</code> ثم حدّث الصفحة.
          </div>
        ) : null}

        {loading && activeTab !== 'add-admin' ? (
          <p className="py-20 text-center text-muted">جاري تحميل الداشبورد...</p>
        ) : (
          <>
            {activeTab === 'add-admin' ? (
              <div className="flex min-h-[60vh] items-center justify-center px-2 py-10">
                <AddAdminCard
                  currentUserEmail={currentUserEmail}
                  newAdminEmail={newAdminEmail}
                  newAdminPassword={newAdminPassword}
                  adminMessage={adminMessage}
                  isAddingAdmin={isAddingAdmin}
                  onNewAdminEmailChange={setNewAdminEmail}
                  onNewAdminPasswordChange={setNewAdminPassword}
                  onSubmit={handleAddAdmin}
                />
              </div>
            ) : null}

            {activeTab === 'overview' ? (
              <OverviewTab products={products} orders={orders} coupons={coupons} />
            ) : null}
            {activeTab === 'products' ? (
              <ProductsTab products={products} onRefresh={fetchAllData} onLog={handleActivityLog} />
            ) : null}
            {activeTab === 'categories' ? <CategoriesTab onLog={handleActivityLog} /> : null}
            {activeTab === 'orders' ? (
              <OrdersTab orders={orders} products={products} onRefresh={fetchAllData} onLog={handleActivityLog} />
            ) : null}
            {activeTab === 'customers' ? <CustomersTab customers={customers} loading={customersLoading} /> : null}
            {activeTab === 'inventory' ? (
              <InventoryTab generalInventory={generalInventory} onRefresh={fetchAllData} onLog={handleActivityLog} />
            ) : null}
            {activeTab === 'coupons' ? (
              <CouponsTab coupons={coupons} schemaReady={couponsReady} onRefresh={fetchAllData} onLog={handleActivityLog} />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="circuit-bg flex min-h-screen items-center justify-center p-6" dir="rtl">
          <p className="text-sm text-muted">جاري تحميل لوحة التحكم...</p>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}