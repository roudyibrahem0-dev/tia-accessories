import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getGreenApiConfig } from '@/lib/green-api';

type CheckoutItem = {
  name?: unknown;
  quantity?: unknown;
  price?: unknown;
  unitPrice?: unknown;
  unit_price?: unknown;
  finalPrice?: unknown;
  final_price?: unknown;
};

type CheckoutPayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  items?: unknown;
  totalPrice?: unknown;
  address?: unknown;
  details?: unknown;
};

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing server Supabase environment variables.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\D/g, '');
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function formatItem(item: CheckoutItem, index: number): string {
  const name = asText(item.name) || `منتج ${index + 1}`;
  const quantity = Math.max(1, Math.trunc(asNumber(item.quantity) || 1));
  const unitPrice = asNumber(item.unitPrice ?? item.unit_price ?? item.price);
  const lineTotal = asNumber(item.finalPrice ?? item.final_price) || unitPrice * quantity;
  return `• ${name} | الكمية: ${quantity} | السعر: ${lineTotal.toFixed(2)}`;
}

export async function POST(request: Request) {
  let orderId: number | undefined;

  try {
    const body = (await request.json()) as CheckoutPayload;
    const name = asText(body.name);
    const phone = normalizePhone(asText(body.phone));
    const email = normalizeEmail(asText(body.email));
    const address = asText(body.address);
    const details = asText(body.details);
    const items = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : [];
    const totalPrice = asNumber(body.totalPrice);

    if (!name || !phone || !address || !items.length || totalPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'بيانات الطلب غير مكتملة أو غير صالحة.' },
        { status: 400 },
      );
    }

    const supabase = getServerSupabase();
    const itemIds = items
      .map((item) => Number((item as { product_id?: unknown }).product_id ?? (item as { id?: unknown }).id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (itemIds.length !== items.length) {
      return NextResponse.json({ success: false, error: 'بعض عناصر الطلب تفتقد إلى معرف المنتج.' }, { status: 400 });
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, price, stock_qty, is_active')
      .in('id', itemIds);

    if (productsError || !productsData) {
      throw new Error(productsError?.message || 'تعذر التحقق من المنتجات في قاعدة البيانات.');
    }

    const productMap = new Map((productsData || []).map((product) => [Number(product.id), product]));
    const missingProductIds = itemIds.filter((id) => !productMap.has(id));
    if (missingProductIds.length) {
      return NextResponse.json({ success: false, error: 'أحد المنتجات غير موجود.', missingProductIds }, { status: 400 });
    }

    const computedTotal = items.reduce((sum, item, index) => {
      const productId = Number((item as { product_id?: unknown }).product_id ?? (item as { id?: unknown }).id);
      const product = productMap.get(productId);
      const quantity = Math.max(1, Math.trunc(asNumber(item.quantity) || 1));
      const unitPrice = asNumber(item.unitPrice ?? item.unit_price ?? item.price) || Number(product?.price ?? 0);
      const lineTotal = asNumber(item.finalPrice ?? item.final_price) || unitPrice * quantity;

      if (product && product.stock_qty != null && Number(product.stock_qty) < quantity) {
        throw new Error(`المنتج "${asText(item.name) || `منتج ${index + 1}`}" غير متوفر بالكمية المطلوبة.`);
      }

      return sum + lineTotal;
    }, 0);

    if (Math.abs(computedTotal - totalPrice) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'إجمالي الطلب لا يطابق سعر المنتجات المطلوبة.', computedTotal, totalPrice },
        { status: 400 },
      );
    }

    const location = details ? `${address}\n${details}` : address;
    const { data: phoneMatch, error: phoneMatchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (phoneMatchError) throw new Error(phoneMatchError.message);

    const { data: emailMatch, error: emailMatchError } = email
      ? await supabase.from('customers').select('id').ilike('email', email).maybeSingle()
      : { data: null, error: null };
    if (emailMatchError) throw new Error(emailMatchError.message);

    let customerId = Number(phoneMatch?.id ?? emailMatch?.id) || null;
    if (customerId) {
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({ name, email: email || null, address: location, updated_at: new Date().toISOString() })
        .eq('id', customerId);
      if (customerUpdateError) throw new Error(customerUpdateError.message);
    } else {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({ name, phone, email: email || null, address: location })
        .select('id')
        .single();
      if (customerError || !customer) throw new Error(customerError?.message || 'تعذر إنشاء ملف العميل.');
      customerId = Number(customer.id);
    }

    const orderItems = items.map((item, index) => ({
      product_id: Number((item as { product_id?: unknown }).product_id ?? (item as { id?: unknown }).id),
      name: asText(item.name) || `منتج ${index + 1}`,
      unit_price: asNumber(item.unitPrice ?? item.unit_price ?? item.price),
      final_price: asNumber(item.finalPrice ?? item.final_price) || asNumber(item.price),
      image_url: null,
      quantity: Math.max(1, Math.trunc(asNumber(item.quantity) || 1)),
    }));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        customer_location: location,
        total_price: totalPrice,
        subtotal: totalPrice,
        status: 'pending',
        order_source: 'other',
        items: orderItems,
        notes: details || null,
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || 'تعذر حفظ الطلب في قاعدة البيانات.');
    }
    orderId = order.id;
    const order_number = order.order_number ?? order.id;

    const orderedQuantities = new Map<number, number>();
    for (const item of orderItems) {
      orderedQuantities.set(item.product_id, (orderedQuantities.get(item.product_id) ?? 0) + item.quantity);
    }
    for (const [productId, quantity] of orderedQuantities) {
      const product = productMap.get(productId);
      if (!product || product.stock_qty == null) continue;
      const { error: stockUpdateError } = await supabase
        .from('products')
        .update({ stock_qty: Math.max(0, Number(product.stock_qty) - quantity) })
        .eq('id', productId);
      if (stockUpdateError) throw new Error(stockUpdateError.message);
    }

    const greenApi = getGreenApiConfig();
    if (!greenApi.chatId) {
      return NextResponse.json(
        { success: false, error: 'تم حفظ الطلب، لكن GREEN_API_CHAT_ID غير مضبوط.', orderId, order_number },
        { status: 503 },
      );
    }

    const itemsList = items.map(formatItem).join('\n');
    const message = [
      `📦 *طلب جديد (#${order_number})*`,
      `👤 *الزبون:* ${name}`,
      `📞 *الرقم:* ${phone}`,
      '📝 *تفاصيل الطلب:*',
      itemsList,
      '',
      `💰 *الإجمالي:* ${totalPrice}`,
    ].join('\n');

    const greenApiResponse = await fetch(
      `https://api.green-api.com/waInstance${greenApi.instanceId}/sendMessage/${greenApi.token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: greenApi.chatId, message }),
      },
    );

    if (!greenApiResponse.ok) {
      const responseText = await greenApiResponse.text();
      return NextResponse.json(
        { success: false, error: 'تم حفظ الطلب، لكن فشل إرساله عبر Green API.', orderId, order_number, details: responseText },
        { status: 502 },
      );
    }

    const greenApiResult = await greenApiResponse.json().catch(() => null);
    return NextResponse.json({ success: true, orderId, order_number, greenApi: greenApiResult }, { status: 201 });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.', ...(orderId ? { orderId } : {}) },
      { status: 500 },
    );
  }
}