'use client';

import { useMemo, useState } from 'react';
import { money } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { GeneralInventoryItem } from '@/lib/types';
import { Field, Panel, PrimaryButton, StatCard, TextInput } from './ui';

type Props = { generalInventory: GeneralInventoryItem[]; onRefresh: () => Promise<void>; onLog?: (action: string, details: string) => void };

export function InventoryTab({ generalInventory, onRefresh, onLog }: Props) {
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('ar');
    if (!value) return generalInventory;
    return generalInventory.filter((item) => `${item.name} ${item.material}`.toLocaleLowerCase('ar').includes(value));
  }, [generalInventory, query]);

  const stockValue = generalInventory.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const totalPieces = generalInventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  function reset() {
    setName(''); setMaterial(''); setQuantity(''); setPrice(''); setEditingId(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (!name.trim() || !material.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity < 0 || parsedPrice < 0) {
      alert('أدخل اسم القطعة والمادة والعدد والسعر بشكل صحيح');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), material: material.trim(), quantity: parsedQuantity, price: parsedPrice };
      const result = editingId ? await supabase.from('general_inventory').update(payload).eq('id', editingId) : await supabase.from('general_inventory').insert([payload]);
      if (result.error) throw result.error;
      onLog?.(editingId ? 'تحديث مخزون الإكسسوارات' : 'إضافة مخزون إكسسوارات', `${payload.name} | ${payload.material} | العدد: ${payload.quantity}`);
      reset(); await onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally { setSaving(false); }
  }

  async function remove(item: GeneralInventoryItem) {
    if (!confirm(`هل تريد حذف ${item.name} من المخزون؟`)) return;
    const { error } = await supabase.from('general_inventory').delete().eq('id', item.id);
    if (error) alert(error.message);
    else { onLog?.('حذف من مخزون الإكسسوارات', `تم حذف ${item.name}`); await onRefresh(); }
  }

  function edit(item: GeneralInventoryItem) {
    setEditingId(item.id); setName(item.name || ''); setMaterial(item.material || ''); setQuantity(String(item.quantity ?? '')); setPrice(String(item.price ?? ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="إجمالي القطع" value={totalPieces} hint="عدد الوحدات المتوفرة" />
        <StatCard label="قيمة المخزون" value={money(stockValue)} hint="السعر × العدد" />
        <StatCard label="قطع منخفضة التوفر" value={generalInventory.filter((item) => Number(item.quantity) <= 3).length} hint="ثلاث وحدات أو أقل" />
      </div>
      <Panel title={editingId ? 'تعديل قطعة في المخزون' : 'إضافة قطعة إلى المخزون'}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="اسم القطعة"><TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: سوار" /></Field>
          <Field label="المادة"><TextInput value={material} onChange={(event) => setMaterial(event.target.value)} placeholder="مثال: ستانلس ستيل" /></Field>
          <Field label="عدد الوحدات"><TextInput type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
          <Field label="سعر الوحدة"><TextInput type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
          <div className="flex items-end gap-2"><PrimaryButton type="submit" disabled={saving} className="flex-1">{saving ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إضافة'}</PrimaryButton>{editingId ? <button type="button" onClick={reset} className="rounded-xl border border-border-copper px-3 py-2 text-sm">إلغاء</button> : null}</div>
        </form>
      </Panel>
      <Panel title={`مخزون الإكسسوارات (${filtered.length})`} action={<TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو المادة" className="max-w-[240px]" />}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm"><thead><tr className="border-b border-border-copper text-muted"><th className="px-2 py-2 text-start">القطعة</th><th className="px-2 py-2 text-start">المادة</th><th className="px-2 py-2 text-start">العدد</th><th className="px-2 py-2 text-start">السعر</th><th className="px-2 py-2 text-center">إجراءات</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="px-2 py-3 font-semibold">{item.name}</td><td className="px-2 py-3 text-muted">{item.material}</td><td className={`px-2 py-3 ${Number(item.quantity) <= 3 ? 'font-bold text-amber-500' : ''}`}>{item.quantity}</td><td className="px-2 py-3 text-copper-bright">{money(Number(item.price || 0))}</td><td className="px-2 py-3 text-center"><button type="button" onClick={() => edit(item)} className="ml-3 text-xs text-copper-bright">تعديل</button><button type="button" onClick={() => remove(item)} className="text-xs text-red-400">حذف</button></td></tr>)}</tbody></table>
          {!filtered.length ? <p className="py-8 text-center text-sm text-muted">لا توجد قطع في المخزون.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
