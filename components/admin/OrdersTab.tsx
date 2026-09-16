'use client';

import { useDeferredValue, useState } from 'react';
import { money } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/lib/types';
import { Badge, cardShellClass, Field, GhostButton, Panel, PrimaryButton, softCardClass, TextInput, TextSelect, TextTextarea } from './ui';
import type { Product } from '@/lib/types';

type Props = {
  orders: Order[];
  products: Product[];
  onRefresh: () => Promise<void>;
  onLog?: (action: string, details: string) => void;
};

type ManualOrderLine = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  size: string;
  unitPrice: number;
  isCustom: boolean;
};

const orderSourceOptions = [
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'facebook', label: 'فيسبوك' },
  { value: 'instagram', label: 'إنستغرام' },
  { value: 'other', label: 'آخر' },
];

const statusLabel: Record<OrderStatus, string> = {
  draft: 'مسودة',
  pending: 'قيد الانتظار',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  pending_payment: 'قيد الدفع',
  paid: 'تم الدفع',
  cancelled: 'ملغي',
};

const statusTone: Record<OrderStatus, 'amber' | 'copper' | 'green' | 'red' | 'slate'> = {
  draft: 'slate',
  pending: 'amber',
  processing: 'copper',
  shipped: 'green',
  delivered: 'green',
  pending_payment: 'amber',
  paid: 'green',
  cancelled: 'red',
};

export function OrdersTab({ orders, products, onRefresh, onLog }: Props) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<Record<number, { paidAmount: string; handleRemaining: 'discount' | 'deferred' }>>({});
  const [savingPayment, setSavingPayment] = useState<number | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [savingManualOrder, setSavingManualOrder] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualSource, setManualSource] = useState<'whatsapp' | 'facebook' | 'instagram' | 'other'>('whatsapp');
  const [manualNotes, setManualNotes] = useState('');
  const [manualShipping, setManualShipping] = useState('0');
  const [manualDiscount, setManualDiscount] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'processing' | 'pending_payment'>('all');
  const [manualLines, setManualLines] = useState<ManualOrderLine[]>([
    { id: crypto.randomUUID(), productId: '', name: '', quantity: 1, size: '', unitPrice: 0, isCustom: false },
  ]);

  const subtotal = manualLines.reduce((sum, line) => sum + Number(line.unitPrice || 0) * Number(line.quantity || 0), 0);
  const shippingCost = Number(manualShipping || 0);
  const discountAmount = Number(manualDiscount || 0);
  const totalBeforeDiscount = subtotal + shippingCost;
  const manualTotal = Math.max(0, totalBeforeDiscount - discountAmount);

  function addManualLine() {
    setManualLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: '', name: '', quantity: 1, size: '', unitPrice: 0, isCustom: false },
    ]);
  }

  function updateManualLine(id: string, field: keyof ManualOrderLine, value: string | number | boolean) {
    setManualLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;

        if (field === 'productId' && typeof value === 'string') {
          const product = products.find((p) => String(p.id) === value);
          return {
            ...line,
            productId: value,
            name: product?.name || '',
            unitPrice: product ? Number(product.price || 0) : 0,
            isCustom: !product,
            size: '',
          };
        }

        if (field === 'quantity' && typeof value === 'number') {
          return { ...line, quantity: Math.max(1, value) };
        }

        if (field === 'unitPrice' && typeof value === 'number') {
          return { ...line, unitPrice: Math.max(0, value) };
        }

        if (field === 'isCustom' && typeof value === 'boolean') {
          return { ...line, isCustom: value, productId: '', name: value ? line.name : '', unitPrice: value ? line.unitPrice : 0 };
        }

        return { ...line, [field]: value };
      }),
    );
  }

  function removeManualLine(id: string) {
    setManualLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.id !== id)));
  }

  function resetManualForm() {
    setManualCustomerName('');
    setManualPhone('');
    setManualAddress('');
    setManualSource('whatsapp');
    setManualNotes('');
    setManualShipping('0');
    setManualDiscount('0');
    setManualLines([{ id: crypto.randomUUID(), productId: '', name: '', quantity: 1, size: '', unitPrice: 0, isCustom: false }]);
    setShowManualForm(false);
  }

  async function handleCreateManualOrder(e: React.FormEvent, asDraft = false) {
    e.preventDefault();

    if (!manualCustomerName.trim() || !manualPhone.trim() || !manualAddress.trim()) {
      alert('يرجى إدخال اسم العميل، الهاتف، والعنوان');
      return;
    }

    const validLines = manualLines.filter((line) => {
      if (!line.isCustom) return line.productId && line.name && Number(line.quantity || 0) > 0 && Number(line.unitPrice || 0) >= 0;
      return line.name.trim() && Number(line.quantity || 0) > 0 && Number(line.unitPrice || 0) >= 0;
    });

    if (!validLines.length) {
      alert('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    setSavingManualOrder(true);
    try {
      const items = validLines.map((line) => ({
        product_id: line.isCustom ? 0 : Number(line.productId || 0),
        name: line.name.trim(),
        unit_price: Number(line.unitPrice || 0),
        final_price: Number(line.unitPrice || 0) * Number(line.quantity || 0),
        image_url: null,
      }));

      const payload = {
        customer_name: manualCustomerName.trim(),
        customer_phone: manualPhone.trim(),
        customer_location: manualAddress.trim(),
        order_source: manualSource,
        subtotal,
        discount_amount: Number(manualDiscount || 0),
        shipping_cost: Number(manualShipping || 0),
        total_price: manualTotal,
        status: asDraft ? 'draft' : 'pending',
        items,
        notes: manualNotes.trim() || null,
      };

      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error;

      if (!asDraft) {
        for (const line of validLines) {
          if (line.isCustom) continue;
          const product = products.find((p) => String(p.id) === String(line.productId));
          if (!product || product.stock_qty == null) continue;
          const nextQty = Math.max(0, Number(product.stock_qty) - Number(line.quantity || 0));
          await supabase.from('products').update({ stock_qty: nextQty }).eq('id', product.id);
        }
      }

      onLog?.(
        'إنشاء طلب يدوي',
        asDraft ? `تم حفظ طلب جديد كمسودة للعميل ${manualCustomerName.trim()}` : `تم إنشاء طلب جديد للعميل ${manualCustomerName.trim()} من ${manualSource}`,
      );
      resetManualForm();
      await onRefresh();
      alert(asDraft ? 'تم حفظ الطلب كمسودة بنجاح' : 'تم إنشاء الطلب بنجاح وظهر في قائمة الطلبات');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingManualOrder(false);
    }
  }

  async function updateStatus(id: number, status: OrderStatus) {
    const currentOrder = orders.find((item) => item.id === id);
    const previousStatus = statusLabel[currentOrder?.status as OrderStatus] || currentOrder?.status || 'غير معروف';
    const orderNumber = currentOrder?.order_number ?? id;

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else {
      const nextStatus = statusLabel[status];
      onLog?.('تحديث حالة الطلب', `تم تغيير حالة الطلب #${orderNumber}\nقبل: ${previousStatus} → بعد: ${nextStatus}`);
      await onRefresh();
    }
  }

  async function handlePayment(orderId: number) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const orderNumber = order.order_number ?? orderId;

    const form = paymentForm[orderId];
    if (!form) return;

    const paidAmount = parseFloat(form.paidAmount);
    if (isNaN(paidAmount) || paidAmount < 0) {
      alert('أدخل مبلغ صحيح');
      return;
    }

    const remaining = Number(order.total_price || 0) - paidAmount;
    const isDiscount = form.handleRemaining === 'discount';

    setSavingPayment(orderId);
    try {
      const updateData: Record<string, unknown> = {
        status: 'paid',
        paid_amount: paidAmount,
        remaining_amount: Math.max(0, remaining),
        is_discount: isDiscount,
        deferred_payment: !isDiscount,
      };

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;

      onLog?.(
        'تسجيل الدفع',
        `تم تسجيل الدفع للطلب #${orderNumber}\nالمبلغ المدفوع: ${money(paidAmount)}\nالمتبقي: ${money(Math.max(0, remaining))}\nمعالجة المتبقي: ${isDiscount ? 'خصم' : 'آجل'}`,
      );

      setPaymentForm((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setExpandedOrderId(null);
      await onRefresh();
      alert('تم تسجيل الدفع بنجاح');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPayment(null);
    }
  }

  const pending = orders.filter((o) => o.status === 'pending').length;
  const drafts = orders.filter((o) => o.status === 'draft').length;
  const inProgress = orders.filter((o) => o.status === 'processing' || o.status === 'shipped').length;
  const pendingPayment = orders.filter((o) => o.status === 'pending_payment').length;
  const revenue = orders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLocaleLowerCase('ar'));
  const visibleOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === 'all' ||
      order.status === statusFilter ||
      (statusFilter === 'processing' && (order.status === 'processing' || order.status === 'shipped'));
    const matchesSearch =
      !deferredSearchQuery ||
      String(order.order_number ?? order.id).includes(deferredSearchQuery) ||
      (order.customer_name ?? '').toLocaleLowerCase('ar').includes(deferredSearchQuery) ||
      order.customer_phone.toLocaleLowerCase('ar').includes(deferredSearchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <PrimaryButton type="button" onClick={() => setShowManualForm((prev) => !prev)}>
          {showManualForm ? 'إغلاق النموذج' : 'إنشاء طلب جديد'}
        </PrimaryButton>
      </div>

      {showManualForm ? (
        <Panel title="إنشاء طلب يدوي جديد">
          <form onSubmit={(e) => handleCreateManualOrder(e, false)} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="اسم العميل">
                <TextInput value={manualCustomerName} onChange={(e) => setManualCustomerName(e.target.value)} placeholder="مثال: أحمد" />
              </Field>
              <Field label="رقم الهاتف / واتساب">
                <TextInput value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="9665xxxxxx" />
              </Field>
              <Field label="العنوان">
                <TextInput value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} placeholder="العنوان الكامل" />
              </Field>
              <Field label="مصدر الطلب">
                <TextSelect value={manualSource} onChange={(e) => setManualSource(e.target.value as 'whatsapp' | 'facebook' | 'instagram' | 'other')}>
                  {orderSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </TextSelect>
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-copper-bright">المنتجات</h3>
                <GhostButton type="button" onClick={addManualLine}>+ إضافة سطر</GhostButton>
              </div>

              {manualLines.map((line, index) => (
                <div key={line.id} className="rounded-xl border border-border-copper bg-[#0d0d12] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">السطر {index + 1}</span>
                    {manualLines.length > 1 ? (
                      <button type="button" onClick={() => removeManualLine(line.id)} className="text-xs text-red-300">حذف</button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <Field label="المنتج">
                      {!line.isCustom ? (
                        <TextSelect value={line.productId} onChange={(e) => updateManualLine(line.id, 'productId', e.target.value)}>
                          <option value="">اختر منتج</option>
                          {products.map((product) => (
                            <option key={product.id} value={String(product.id)}>{product.name}</option>
                          ))}
                        </TextSelect>
                      ) : (
                        <TextInput value={line.name} onChange={(e) => updateManualLine(line.id, 'name', e.target.value)} placeholder="اسم المنتج المخصص" />
                      )}
                    </Field>

                    <Field label="الحجم / النوع">
                      <TextInput value={line.size} onChange={(e) => updateManualLine(line.id, 'size', e.target.value)} placeholder="مثال: صغير / كبير" />
                    </Field>

                    <Field label="الكمية">
                      <TextInput type="number" min="1" value={line.quantity} onChange={(e) => updateManualLine(line.id, 'quantity', Number(e.target.value || 1))} />
                    </Field>

                    <Field label="السعر">
                      <TextInput type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateManualLine(line.id, 'unitPrice', Number(e.target.value || 0))} />
                    </Field>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => updateManualLine(line.id, 'isCustom', !line.isCustom)}
                        className="w-full rounded-xl border border-border-copper bg-transparent px-3 py-2 text-xs text-muted transition hover:text-white"
                      >
                        {line.isCustom ? 'منتج مسجل' : 'منتج مخصص'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="تكلفة الشحن / التوصيل">
                <TextInput type="number" min="0" step="0.01" value={manualShipping} onChange={(e) => setManualShipping(e.target.value)} />
              </Field>
              <Field label="الخصم">
                <TextInput type="number" min="0" step="0.01" value={manualDiscount} onChange={(e) => setManualDiscount(e.target.value)} />
              </Field>
              <div className="flex items-end">
                <div className="w-full rounded-xl border border-border-copper bg-[#0d0d12] px-3 py-2.5">
                  <div className="text-[11px] text-muted">الإجمالي</div>
                  <div className="text-lg font-black text-copper-bright">{money(manualTotal)}</div>
                </div>
              </div>
            </div>

            <Field label="ملاحظات إضافية">
              <TextTextarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} rows={3} placeholder="ملاحظات الطلب أو تفاصيل الإكسسوار" />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-copper bg-[#0d0d12] p-3 text-sm">
              <div>
                <div className="text-muted">المجموع الفرعي: {money(subtotal)}</div>
                <div className="text-muted">التوصيل: {money(shippingCost)}</div>
                <div className="text-muted">الخصم: {money(discountAmount)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostButton type="button" disabled={savingManualOrder} onClick={(e) => handleCreateManualOrder(e, true)}>
                  {savingManualOrder ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                </GhostButton>
                <PrimaryButton type="submit" disabled={savingManualOrder}>
                  {savingManualOrder ? 'جاري الحفظ...' : 'حفظ الطلب'}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className={`${cardShellClass} p-4 text-sm`}>إجمالي المدفوع: <strong className="text-emerald-300">{money(revenue)}</strong></div>
        <div className={`${cardShellClass} p-4 text-sm`}>الطلبات المعروضة: <strong className="text-copper-bright">{visibleOrders.length}</strong></div>
      </div>

      <Panel title="طلبات الزبائن بالتفصيل">
        <div className="mb-4 space-y-3">
          <TextInput type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="ابحث برقم الطلب أو اسم الزبون أو رقم الهاتف" aria-label="البحث في الطلبات" />
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'إجمالي الطلبات', orders.length],
              ['draft', 'المسودات', drafts],
              ['pending', 'بانتظار القبول', pending],
              ['processing', 'قيد التجهيز والشحن', inProgress],
              ['pending_payment', 'قيد الدفع', pendingPayment],
            ].map(([value, label, count]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value as typeof statusFilter)} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${statusFilter === value ? 'border-copper bg-copper/20 text-copper-bright' : 'border-border-copper text-muted hover:text-white'}`}>
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {visibleOrders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const isExpanded = expandedOrderId === o.id;
            const form = paymentForm[o.id];

            return (
              <article key={o.id} className={`${softCardClass} p-4 sm:p-5`}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">طلب #{o.order_number ?? o.id}</h3>
                    <p className="text-xs text-muted">
                      {o.created_at ? new Date(o.created_at).toLocaleString('ar') : '—'}
                    </p>
                  </div>
                  <Badge tone={statusTone[o.status as OrderStatus] || 'slate'}>
                    {statusLabel[o.status as OrderStatus] || o.status}
                  </Badge>
                </div>

                <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted">الموبايل: </span>
                    <strong>{o.customer_phone}</strong>
                  </p>
                  <p>
                    <span className="text-muted">العنوان: </span>
                    <strong>{o.customer_location}</strong>
                  </p>
                  <p>
                    <span className="text-muted">المجموع قبل الخصم: </span>
                    <strong>{money(Number(o.subtotal ?? o.total_price ?? 0))}</strong>
                  </p>
                  <p>
                    <span className="text-muted">خصم الكوبون: </span>
                    <strong className="text-copper-bright">
                      {o.coupon_code
                        ? `${o.coupon_code} (−${money(Number(o.discount_amount || 0))})`
                        : '—'}
                    </strong>
                  </p>
                  {o.status === 'paid' && (
                    <>
                      <p>
                        <span className="text-muted">المبلغ المدفوع: </span>
                        <strong className="text-green-400">{money(Number(o.paid_amount || 0))}</strong>
                      </p>
                      {o.remaining_amount ? (
                        <p>
                          <span className="text-muted">المتبقي: </span>
                          <strong className={o.is_discount ? 'text-yellow-400' : 'text-orange-400'}>
                            {money(Number(o.remaining_amount))} ({o.is_discount ? 'خصم' : 'آجل'})
                          </strong>
                        </p>
                      ) : null}
                    </>
                  )}
                  <p className="sm:col-span-2">
                    <span className="text-muted">الإجمالي النهائي: </span>
                    <strong className="text-lg text-copper-bright">{money(Number(o.total_price || 0))}</strong>
                  </p>
                </div>

                {items.length > 0 && isExpanded ? (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs font-bold text-muted">قطع الطلب:</p>
                    {items.map((item, idx) => (
                      <div
                        key={`${o.id}-${idx}`}
                        className={`${softCardClass} flex items-center justify-between gap-3 px-3 py-2 text-sm`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="text-xs text-muted">الكمية: {item.quantity ?? 1}</p>
                        </div>
                        <div className="text-end">
                          {item.final_price < item.unit_price ? (
                            <>
                              <span className="me-2 text-xs text-muted line-through">
                                {money(item.unit_price)}
                              </span>
                              <span className="font-bold text-copper-bright">
                                {money(item.final_price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-copper-bright">
                              {money(item.final_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {o.status === 'pending_payment' && form ? (
                  <div className="mb-3 space-y-3 rounded-xl border border-copper/30 bg-copper/5 p-3">
                    <p className="text-sm font-bold text-copper-bright">تسجيل الدفع</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted">المبلغ المدفوع</label>
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.paidAmount}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              [o.id]: { ...prev[o.id], paidAmount: e.target.value },
                            }))
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">معالجة المتبقي</label>
                        <select
                          value={form.handleRemaining}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              [o.id]: { ...prev[o.id], handleRemaining: e.target.value as 'discount' | 'deferred' },
                            }))
                          }
                          className="w-full rounded-lg border border-border-copper bg-[#0d0d12] px-3 py-2 text-sm text-white outline-none focus:border-copper"
                        >
                          <option value="discount">خصم</option>
                          <option value="deferred">آجل / دفع لاحق</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePayment(o.id)}
                        disabled={savingPayment === o.id}
                        className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingPayment === o.id ? 'جاري الحفظ...' : 'حفظ الدفع'}
                      </button>
                      <button
                        onClick={() =>
                          setPaymentForm((prev) => {
                            const next = { ...prev };
                            delete next[o.id];
                            return next;
                          })
                        }
                        className="rounded-lg border border-border-copper px-3 py-2 text-sm text-muted hover:text-white"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                    className="rounded-lg border border-border-copper bg-transparent px-3 py-2 text-sm text-muted transition hover:text-white"
                  >
                    {isExpanded ? '▲ إغلاق' : '▼ التفاصيل'}
                  </button>

                  {o.status === 'draft' ? (
                    <GhostButton type="button" onClick={() => updateStatus(o.id, 'pending')}>
                      إرسال الطلب إلى قائمة الانتظار
                    </GhostButton>
                  ) : null}

                  {o.status === 'pending' ? (
                    <GhostButton type="button" onClick={() => updateStatus(o.id, 'processing')}>
                      قبول الطلب
                    </GhostButton>
                  ) : null}

                  {o.status === 'processing' ? (
                    <GhostButton type="button" onClick={() => updateStatus(o.id, 'shipped')}>
                      تم تجهيز الطلب وشحنه
                    </GhostButton>
                  ) : null}

                  {o.status === 'shipped' ? (
                    <GhostButton type="button" onClick={() => updateStatus(o.id, 'delivered')}>تم التسليم</GhostButton>
                  ) : null}

                  {o.status === 'delivered' ? (
                    <GhostButton type="button" onClick={() => updateStatus(o.id, 'pending_payment')}>
                      نقل إلى قيد الدفع
                    </GhostButton>
                  ) : null}

                  {o.status === 'pending_payment' && !form ? (
                    <GhostButton
                      type="button"
                      onClick={() =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          [o.id]: { paidAmount: String(o.total_price || 0), handleRemaining: 'discount' },
                        }))
                      }
                    >
                      تسجيل الدفع
                    </GhostButton>
                  ) : null}

                  {o.status !== 'cancelled' && o.status !== 'paid' ? (
                    <GhostButton
                      type="button"
                      className="text-red-300"
                      onClick={() => updateStatus(o.id, 'cancelled')}
                    >
                      إلغاء
                    </GhostButton>
                  ) : null}
                </div>
              </article>
            );
          })}
          {visibleOrders.length === 0 ? <p className="text-sm text-muted">لا توجد طلبات مطابقة.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
