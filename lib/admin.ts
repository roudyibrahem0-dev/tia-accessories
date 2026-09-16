import { supabase } from './supabase';
export function formatMonthLabel(month: string) { const date = new Date(`${month}-01T00:00:00`); return Number.isNaN(date.getTime()) ? month : date.toLocaleDateString('ar', { month: 'long', year: 'numeric' }); }
export async function signInAdmin(email: string, password: string) { return supabase.auth.signInWithPassword({ email, password }); }
export async function signUpAdmin(email: string, password: string) { return supabase.auth.signUp({ email, password }); }
export async function signOutAdmin() { return supabase.auth.signOut(); }
export async function logAdminActivity(action: string, details: string) { return supabase.from('admin_activity_log').insert({ action, details }); }
export async function fetchAdminActivityLog(limit = 50) { return supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(limit); }
export async function fetchCustomers() { return supabase.from('customers').select('*, orders(*)').order('created_at', { ascending: false }); }
export async function fetchAdminDashboardData(month?: string | null) {
  const [products, orders, coupons, generalInventory] = await Promise.all([
    supabase.from('products').select('*').order('id', { ascending: false }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('coupons').select('*').order('id', { ascending: false }),
    supabase.from('general_inventory').select('*').order('id', { ascending: false }),
  ]);
  return { products: products.data || [], orders: orders.data || [], coupons: coupons.data || [], generalInventory: generalInventory.data || [], couponsReady: !coupons.error, month };
}
