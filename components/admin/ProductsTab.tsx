'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getProductFinalPrice, money } from '@/lib/pricing';
import type { DiscountType, Product } from '@/lib/types';
import { accessoryCategories, normalizeAccessoryCategory } from '@/lib/accessories';
import { Badge, cardShellClass, Field, GhostButton, Panel, PrimaryButton, softCardClass, TextInput, TextSelect, TextTextarea } from './ui';

type Props = {
  products: Product[];
  onRefresh: () => Promise<void>;
  onLog?: (action: string, details: string) => void;
};

const emptyForm = {
  name: '',
  price: '',
  cost: '',
  description: '',
  category: '',
  material: '',
  color_finish: '',
  care_instructions: '',
  warranty_text: 'مقاوم للصدأ ولا يتغير لونه مع الماء',
  stock_qty: '',
  gallery_images: '',
  video_url: '',
  discount_type: 'percent' as DiscountType,
  discount_value: '',
  discount_active: false,
  is_active: true,
};

export function ProductsTab({ products, onRefresh, onLog }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.material || '').toLowerCase().includes(q),
    );
  }, [products, query]);

  function setField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function startEdit(product: Product) {
    setEditingId(product.id);
    const galleryValue = Array.isArray(product.gallery_images)
      ? product.gallery_images.join(', ')
      : typeof product.gallery_images === 'string'
        ? product.gallery_images
        : '';

    setForm({
      name: product.name || '',
      price: String(product.price ?? ''),
      cost: String(product.cost ?? ''),
      description: product.description || '',
      category: product.category || '',
      material: product.material || '',
      color_finish: product.color_finish || '',
      care_instructions: product.care_instructions || '',
      warranty_text: product.warranty_text || 'مقاوم للصدأ ولا يتغير لونه مع الماء',
      stock_qty: String(product.stock_qty ?? ''),
      gallery_images: galleryValue,
      video_url: product.video_url || '',
      discount_type: (product.discount_type as DiscountType) || 'percent',
      discount_value: String(product.discount_value ?? ''),
      discount_active: Boolean(product.discount_active),
      is_active: product.is_active !== false,
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setGalleryFiles([]);
    setVideoFile(null);
  }

  async function uploadMediaFile(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'file';
    const folder = file.type.startsWith('video/') ? 'videos' : 'images';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  }

  function getReadableError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
        return (err as { message: string }).message;
      }
      try {
        return JSON.stringify(err);
      } catch {
        return 'Unknown error';
      }
    }
    return String(err);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert('الرجاء تعبئة اسم القطعة والسعر');
      return;
    }

    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const url = await uploadMediaFile(imageFile);
        if (url) imageUrl = url;
      }

      const uploadedGalleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const url = await uploadMediaFile(file);
        if (url) uploadedGalleryUrls.push(url);
      }

      const galleryUrlsFromField = form.gallery_images
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const videoUrl = videoFile ? await uploadMediaFile(videoFile) : form.video_url.trim() || null;
      const finalGallery = Array.from(new Set([...(imageUrl ? [imageUrl] : []), ...uploadedGalleryUrls, ...galleryUrlsFromField]));

      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        cost: parseFloat(form.cost) || 0,
        description: form.description.trim() || null,
        category: normalizeAccessoryCategory(form.category) || null,
        material: form.material.trim() || null,
        color_finish: form.color_finish.trim() || null,
        care_instructions: form.care_instructions.trim() || null,
        warranty_text: form.warranty_text.trim() || null,
        stock_qty: parseInt(form.stock_qty || '0', 10) || 0,
        gallery_images: finalGallery.length ? finalGallery : null,
        video_url: videoUrl,
        discount_type: form.discount_active ? form.discount_type : null,
        discount_value: form.discount_active ? parseFloat(form.discount_value) || 0 : 0,
        discount_active: form.discount_active,
        is_active: form.is_active,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };

      const result = editingId
        ? await supabase.from('products').update(payload).eq('id', editingId).select('id').single()
        : await supabase.from('products').insert([payload]).select('id').single();

      if (result.error) {
        // Fallback for DBs that haven't run schema.sql yet
        const basic = {
          name: payload.name,
          price: payload.price,
          cost: payload.cost,
          ...(imageUrl ? { image_url: imageUrl } : {}),
          ...(payload.gallery_images ? { gallery_images: payload.gallery_images } : {}),
          ...(payload.video_url ? { video_url: payload.video_url } : {}),
        };
        const retry = editingId
          ? await supabase.from('products').update(basic).eq('id', editingId)
          : await supabase.from('products').insert([basic]);
        if (retry.error) throw retry.error;
        alert(
          'تم الحفظ بالحقول الأساسية فقط. شغّل ملف supabase/schema.sql في Supabase لتفعيل الوصف والخصم وباقي التفاصيل.',
        );
      } else {
        const actionText = editingId ? 'تحديث قطعة' : 'إضافة قطعة';
        const productName = payload.name.trim() || 'قطعة';
        const previousText = editingId
          ? `قبل: الاسم=${products.find((product) => product.id === editingId)?.name || '—'} | السعر=${products.find((product) => product.id === editingId)?.price ?? '—'} | الحجم=${products.find((product) => product.id === editingId)?.category || '—'}\nبعد: الاسم=${payload.name} | السعر=${payload.price} | الحجم=${payload.category || '—'}`
          : `إضافة جديدة: الاسم=${payload.name} | السعر=${payload.price} | الحجم=${payload.category || '—'}`;
        onLog?.(actionText, `تم ${editingId ? 'تحديث' : 'إضافة'} القطعة: ${productName}\n${previousText}`);
        alert(editingId ? 'تم تحديث القطعة بنجاح' : 'تم إضافة القطعة بنجاح');
      }

      resetForm();
      await onRefresh();
    } catch (err: unknown) {
      const message = getReadableError(err);
      console.error('ProductsTab submit error:', err);
      alert('خطأ: ' + message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('حذف هذه القطعة؟')) return;
    const target = products.find((product) => product.id === id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      onLog?.('حذف قطعة', `تم حذف القطعة: ${target?.name || 'غير معروف'}\nالمعلومات: السعر=${target?.price ?? '—'} | الحجم=${target?.category || '—'} | المخزون=${target?.stock_qty ?? '—'}`);
      await onRefresh();
    }
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: product.is_active === false })
      .eq('id', product.id);
    if (error) alert('تفعيل/إيقاف يحتاج عمود is_active — شغّل schema.sql');
    else {
      const previousState = product.is_active === false ? 'موقوف' : 'مفعّل';
      const nextState = product.is_active === false ? 'مفعّل' : 'موقوف';
      onLog?.('تغيير حالة القطعة', `تم ${product.is_active === false ? 'تفعيل' : 'إيقاف'} القطعة: ${product.name}\nالحالة: ${previousState} → ${nextState}`);
      await onRefresh();
    }
  }

  return (
    <div>
      <Panel title={editingId ? `تعديل القطعة #${editingId}` : 'إضافة قطعة جديدة'}>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="اسم القطعة *">
            <TextInput value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </Field>
          <Field label="سعر البيع ($) *">
            <TextInput type="number" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} />
          </Field>
          <Field label="التكلفة الداخلية ($)">
            <TextInput type="number" step="0.01" value={form.cost} onChange={(e) => setField('cost', e.target.value)} />
          </Field>
          <Field label="الفئة">
            <TextSelect value={form.category} onChange={(e) => setField('category', e.target.value)}>
              <option value="">اختر فئة القطعة</option>
              {accessoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </TextSelect>
          </Field>
          <Field label="المادة">
            <TextInput value={form.material} onChange={(e) => setField('material', e.target.value)} placeholder="ستانلس ستيل، فضة 925، مطلي ذهب..." />
          </Field>
          <Field label="اللون / اللمسة النهائية">
            <TextInput value={form.color_finish} onChange={(e) => setField('color_finish', e.target.value)} placeholder="فضي، ذهبي، روز غولد..." />
          </Field>
          <Field label="تعليمات العناية" className="sm:col-span-2">
            <TextInput value={form.care_instructions} onChange={(e) => setField('care_instructions', e.target.value)} placeholder="مقاوم للماء، تجنبي العطور..." />
          </Field>
          <Field label="وسم الضمان" className="sm:col-span-2">
            <TextInput value={form.warranty_text} onChange={(e) => setField('warranty_text', e.target.value)} placeholder="مقاوم للصدأ ولا يتغير لونه مع الماء" />
          </Field>
          <Field label="الكمية المتوفرة">
            <TextInput type="number" value={form.stock_qty} onChange={(e) => setField('stock_qty', e.target.value)} />
          </Field>
          <Field label="صورة القطعة (ملف)" className="sm:col-span-2 lg:col-span-3">
            <TextInput type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </Field>
          <Field label="صور إضافية (ملفات)" className="sm:col-span-2 lg:col-span-3">
            <TextInput
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
            />
          </Field>
          <Field label="فيديو المنتج (ملف)" className="sm:col-span-2 lg:col-span-3">
            <TextInput type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
          </Field>
          <Field label="قصة / وصف القطعة" className="sm:col-span-2 lg:col-span-3">
            <TextTextarea
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="تفاصيل القطعة اللي بيشوفها الزبون..."
            />
          </Field>

          <div className={`${cardShellClass} p-4 sm:col-span-2 lg:col-span-3`}>
            <div className="mb-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.discount_active}
                  onChange={(e) => setField('discount_active', e.target.checked)}
                />
                تفعيل خصم يظهر للزبون
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setField('is_active', e.target.checked)}
                />
                القطعة ظاهرة في المتجر
              </label>
            </div>
            {form.discount_active && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نوع الخصم">
                  <TextSelect
                    value={form.discount_type}
                    onChange={(e) => setField('discount_type', e.target.value as DiscountType)}
                  >
                    <option value="percent">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت $</option>
                  </TextSelect>
                </Field>
                <Field label="قيمة الخصم">
                  <TextInput
                    type="number"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setField('discount_value', e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <PrimaryButton type="submit" disabled={uploading}>
              {uploading ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'حفظ ونشر القطعة'}
            </PrimaryButton>
            {editingId ? (
              <GhostButton type="button" onClick={resetForm}>
                إلغاء التعديل
              </GhostButton>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel
        title={`قطع المتجر (${filtered.length})`}
        action={
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث..."
            className="max-w-[220px]"
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const finalPrice = getProductFinalPrice(p);
            const hasDiscount = Boolean(p.discount_active && finalPrice < Number(p.price));
            return (
              <article key={p.id} className={`${softCardClass} overflow-hidden`}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-[#121218] text-muted">بدون صورة</div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white">{p.name}</h3>
                    <Badge tone={p.is_active === false ? 'slate' : 'green'}>
                      {p.is_active === false ? 'مخفية' : 'ظاهرة'}
                    </Badge>
                  </div>
                  {p.description ? <p className="line-clamp-2 text-xs text-muted">{p.description}</p> : null}
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted">
                    <span>التكلفة: {money(Number(p.cost || 0))}</span>
                    <span>التوفر: {Number(p.stock_qty || 0) > 0 ? 'متوفر' : 'غير متوفر'}</span>
                    <span>المادة: {p.material || '—'}</span>
                    <span>اللمسة: {p.color_finish || '—'}</span>
                    <span>العناية: {p.care_instructions || '—'}</span>
                    <span>الضمان: {p.warranty_text || 'مقاوم للصدأ'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDiscount ? (
                      <>
                        <span className="text-sm text-muted line-through">{money(Number(p.price))}</span>
                        <span className="text-lg font-black text-copper-bright">{money(finalPrice)}</span>
                        <Badge>خصم</Badge>
                      </>
                    ) : (
                      <span className="text-lg font-black text-copper-bright">{money(Number(p.price))}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <GhostButton type="button" onClick={() => startEdit(p)}>
                      تعديل
                    </GhostButton>
                    <GhostButton type="button" onClick={() => toggleActive(p)}>
                      {p.is_active === false ? 'إظهار' : 'إخفاء'}
                    </GhostButton>
                    <GhostButton type="button" onClick={() => handleDelete(p.id)} className="text-red-300">
                      حذف
                    </GhostButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 ? <p className="text-sm text-muted">لا توجد قطع.</p> : null}
      </Panel>
    </div>
  );
}
