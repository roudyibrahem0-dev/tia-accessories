import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getGreenApiConfig, requireGreenApiInventoryChatId } from '@/lib/green-api';

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Missing server Supabase environment variables.');
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 });

    const supabase = getServiceSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: 'جلسة المدير غير صالحة.' }, { status: 401 });

    const { data: admin } = await supabase.from('admin_users').select('id').eq('id', userData.user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });

    const body = (await request.json()) as { itemId?: unknown };
    const itemId = Number(body.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'معرف منتج المخزون غير صالح.' }, { status: 400 });
    }

    const { data: items, error: itemError } = await supabase
      .from('general_inventory')
      .update({ low_stock_alerted: true })
      .eq('id', itemId)
      .eq('low_stock_alerted', false)
      .lt('quantity', 10)
      .select('name, material, quantity');
    if (itemError) throw itemError;
    const item = items?.[0];
    if (!item) return NextResponse.json({ success: true, sent: false });

    const greenApi = getGreenApiConfig();
    const chatId = requireGreenApiInventoryChatId();
    const response = await fetch(
      `https://api.green-api.com/waInstance${greenApi.instanceId}/sendMessage/${greenApi.token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: `تنبيه مخزون منخفض\nالمنتج: ${item.name}\nالمادة: ${item.material}\nالكمية المتبقية: ${item.quantity}`,
        }),
      },
    );
    if (!response.ok) {
      await supabase.from('general_inventory').update({ low_stock_alerted: false }).eq('id', itemId);
      return NextResponse.json({ error: 'فشل إرسال تنبيه واتساب.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, sent: true });
  } catch (error) {
    console.error('Low stock alert error:', error);
    return NextResponse.json({ error: 'تعذر إرسال تنبيه المخزون.' }, { status: 500 });
  }
}