'use client';

import { useState } from 'react';
import { money } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { Coupon, DiscountType } from '@/lib/types';
import { Badge, Field, GhostButton, Panel, PrimaryButton, softCardClass, TextInput, TextSelect } from './ui';

type Props = {
  coupons: Coupon[];
  schemaReady: boolean;
  onRefresh: () => Promise<void>;
  onLog?: (action: string, details: string) => void;
};

export function CouponsTab({ coupons, schemaReady, onRefresh, onLog }: Props) {
  const [code, setCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      alert('أدخل الكود وقيمة الخصم');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('coupons').insert([
        {
          code: code.trim().toUpperCase(),
          custom_name: customName.trim() || null,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          min_order: parseFloat(minOrder) || 0,
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          active: true,
          used_count: 0,
        },
      ]);
      if (error) throw error;
      const couponCode = code.trim().toUpperCase();
      const couponName = customName.trim() || couponCode;
      onLog?.('إنشاء كود خصم', `تم إنشاء كود الخصم: ${couponCode} (${couponName})\nالقيمة: ${discountType === 'percent' ? `${discountValue}%` : `${discountValue}$`} | الحد الأدنى: ${minOrder || '0'} | الانتهاء: ${expiresAt || 'بدون تاريخ'}`);
      setCode('');
      setCustomName('');
      setDiscountValue('');
      setMinOrder('');
      setMaxUses('');
      setExpiresAt('');
      await onRefresh();
      alert('تم إنشاء كود الخصم');
    } catch (err: unknown) {
      alert(
        (err instanceof Error ? err.message : String(err)) +
          '\n\nإذا الجدول غير موجود، شغّل supabase/schema.sql في Supabase.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !coupon.active })
      .eq('id', coupon.id);
    if (error) alert(error.message);
    else {
      onLog?.('تغيير حالة الكوبون', `تم ${coupon.active ? 'إيقاف' : 'تفعيل'} الكود: ${coupon.code}\nالحالة: ${coupon.active ? 'مفعّل' : 'متوقف'} → ${coupon.active ? 'متوقف' : 'مفعّل'}`);
      await onRefresh();
    }
  }

  async function removeCoupon(id: number) {
    if (!confirm('حذف هذا الكود؟')) return;
    const coupon = coupons.find((item) => item.id === id);
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      const value = coupon?.discount_value ?? 0;
      const label = coupon?.discount_type === 'percent' ? `${value}%` : `${value}$`;
      onLog?.('حذف كوبون', `تم حذف الكود: ${coupon?.code || 'غير معروف'}\nالقيمة: ${label} | الحد الأدنى: ${coupon?.min_order ?? '0'}`);
      await onRefresh();
    }
  }

  return (
    <div>
      {!schemaReady ? (
        <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          جدول الكوبونات غير جاهز بعد. افتح Supabase → SQL Editor ونفّذ ملف{' '}
          <code className="text-copper-bright">supabase/schema.sql</code>
        </div>
      ) : null}

      <Panel title="إنشاء كود خصم للزبون">
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="الكود">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE10"
            />
          </Field>
          <Field label="الاسم المخصص (اختياري)">
            <TextInput
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="توفير 10%"
            />
          </Field>
          <Field label="نوع الخصم">
            <TextSelect
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            >
              <option value="percent">نسبة %</option>
              <option value="fixed">مبلغ ثابت $</option>
            </TextSelect>
          </Field>
          <Field label="قيمة الخصم">
            <TextInput
              type="number"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </Field>
          <Field label="حد أدنى للطلب ($)">
            <TextInput type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </Field>
          <Field label="أقصى استخدامات (اختياري)">
            <TextInput type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </Field>
          <Field label="تاريخ الانتهاء (اختياري)">
            <TextInput type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <PrimaryButton type="submit" disabled={saving || !schemaReady}>
              {saving ? 'جاري الإنشاء...' : 'إنشاء الكود'}
            </PrimaryButton>
          </div>
        </form>
      </Panel>

      <Panel title={`أكواد الخصم (${coupons.length})`}>
        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`${softCardClass} flex flex-wrap items-center justify-between gap-3 p-4`}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-copper-bright">{c.code}</span>
                  {c.custom_name && <span className="text-sm text-muted">({c.custom_name})</span>}
                  <Badge tone={c.active ? 'green' : 'slate'}>{c.active ? 'مفعّل' : 'متوقف'}</Badge>
                </div>
                <p className="text-sm text-muted">
                  خصم:{' '}
                  {c.discount_type === 'percent'
                    ? `${c.discount_value}%`
                    : money(Number(c.discount_value))}{' '}
                  · حد أدنى: {money(Number(c.min_order || 0))} · استخدم{' '}
                  {c.used_count || 0}
                  {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                  {c.expires_at
                    ? ` · ينتهي ${new Date(c.expires_at).toLocaleDateString('ar')}`
                    : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <GhostButton type="button" onClick={() => toggleActive(c)}>
                  {c.active ? 'إيقاف' : 'تفعيل'}
                </GhostButton>
                <GhostButton type="button" className="text-red-300" onClick={() => removeCoupon(c.id)}>
                  حذف
                </GhostButton>
              </div>
            </div>
          ))}
          {coupons.length === 0 ? <p className="text-sm text-muted">لا توجد أكواد بعد.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
