'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, cardShellClass, Field, Panel, PrimaryButton, softCardClass, TextInput, TextTextarea } from './ui';

type CategoryItem = {
  id?: number;
  title: string;
  count: string;
  image: string;
  quote: string;
  author: string;
};

type Props = {
  onLog?: (action: string, details: string) => void;
};

const defaultCategories: CategoryItem[] = [
  {
    title: 'القطع المخصصة',
    count: '24 تصميم',
    image:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    quote: 'تصاميم مخصصة حسب طلب العميل مع لمسة فخمة ومميزة.',
    author: 'أحمد • عميل دائم',
  },
  {
    title: 'ديكور المنزل',
    count: '18 منتج',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    quote: 'قطع منزلية أنيقة تضيف لمسة احترافية للفراغ.',
    author: 'سارة • مصممة داخلية',
  },
  {
    title: 'هدايا شخصية',
    count: '12 خيار',
    image:
      'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80',
    quote: 'هدية فريدة وملموسة تعبر عن الاهتمام والذوق.',
    author: 'ريم • عميلة',
  },
  {
    title: 'أعمال حرفية',
    count: '9 تصميمات',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    quote: 'معدات وأجزاء يدويّة بتصميم احترافي وجودة عالية.',
    author: 'محمد • مخترع',
  },
];

function resetDraft(): CategoryItem {
  return { ...defaultCategories[0] };
}

export function CategoriesTab({ onLog }: Props) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [draft, setDraft] = useState<CategoryItem>(() => resetDraft());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
      if (error) throw error;

      if (data && data.length > 0) {
        setItems(data as CategoryItem[]);
      } else {
        const fallback = defaultCategories.map((item) => ({ ...item }));
        setItems(fallback);
        const { error: insertError } = await supabase.from('categories').insert(
          fallback.map((item) => ({
            title: item.title,
            count: item.count,
            image: item.image,
            quote: item.quote,
            author: item.author,
          })),
        );
        if (!insertError) {
          const refreshed = await supabase.from('categories').select('*').order('id', { ascending: true });
          if (refreshed.data) setItems(refreshed.data as CategoryItem[]);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Failed loading categories:', message);
      setItems(defaultCategories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('فشل في قراءة الصورة'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadCategoryImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { error } = await supabase.storage.from('category-images').upload(path, file, { upsert: true });
      if (error) throw error;
      return supabase.storage.from('category-images').getPublicUrl(path).data.publicUrl;
    } catch {
      return await toDataUrl(file);
    }
  }

  const totalProducts = useMemo(() => items.reduce((sum, item) => sum + Number(String(item.count || '').match(/\d+/)?.[0] || 0), 0), [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      alert('أدخل عنوان التصنيف أولاً');
      return;
    }

    let imageValue = draft.image.trim() || defaultCategories[0].image;
    if (imageFile) {
      try {
        imageValue = await uploadCategoryImage(imageFile);
      } catch {
        alert('تعذر رفع الصورة من الجهاز');
        return;
      }
    }

    const nextDraft = {
      ...draft,
      title: draft.title.trim(),
      count: draft.count.trim() || '0 منتج',
      image: imageValue,
      quote: draft.quote.trim() || 'تصنيف جديد من متجر MR. MAKER',
      author: draft.author.trim() || 'إدارة المتجر',
    };

    try {
      if (editingIndex === null) {
        const { error } = await supabase.from('categories').insert([
          {
            title: nextDraft.title,
            count: nextDraft.count,
            image: nextDraft.image,
            quote: nextDraft.quote,
            author: nextDraft.author,
          },
        ]);
        if (error) throw error;
        onLog?.('إضافة تصنيف', `تم إضافة تصنيف جديد: ${nextDraft.title}\nالعنوان: ${nextDraft.title} | العدد: ${nextDraft.count}`);
      } else {
        const target = items[editingIndex];
        const { error } = await supabase
          .from('categories')
          .update({
            title: nextDraft.title,
            count: nextDraft.count,
            image: nextDraft.image,
            quote: nextDraft.quote,
            author: nextDraft.author,
          })
          .eq('id', target.id);
        if (error) throw error;
        onLog?.('تعديل تصنيف', `تم تعديل التصنيف: ${nextDraft.title}\nقبل: ${target?.title || '—'} | ${target?.count || '—'}\nبعد: ${nextDraft.title} | ${nextDraft.count}`);
      }

      setDraft(resetDraft());
      setEditingIndex(null);
      setImageFile(null);
      await loadCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('فشل حفظ التصنيف: ' + message);
    }
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setDraft({ ...items[index] });
  }

  async function removeItem(index: number) {
    const item = items[index];
    if (!item?.id) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', item.id);
      if (error) throw error;
      onLog?.('حذف تصنيف', `تم حذف التصنيف: ${item?.title || 'غير معروف'}\nتفاصيل: ${item?.count || '—'} | ${item?.author || '—'}`);
      setEditingIndex(null);
      setDraft(resetDraft());
      setImageFile(null);
      await loadCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('فشل حذف التصنيف: ' + message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${cardShellClass} p-4`}>
          <p className="text-xs text-muted">عدد التصنيفات</p>
          <p className="mt-2 text-3xl font-black text-copper-bright">{items.length}</p>
        </div>
        <div className={`${cardShellClass} p-4`}>
          <p className="text-xs text-muted">إجمالي المعروضات</p>
          <p className="mt-2 text-3xl font-black text-copper-bright">{totalProducts}</p>
        </div>
        <div className={`${cardShellClass} p-4`}>
          <p className="text-xs text-muted">الحالة</p>
          <p className="mt-2 text-xl font-black text-copper-bright">جاهز للنشر</p>
        </div>
      </div>

      <Panel title={editingIndex === null ? 'إضافة تصنيف جديد' : `تعديل التصنيف #${editingIndex + 1}`}>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <Field label="عنوان التصنيف">
            <TextInput value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} />
          </Field>
          <Field label="العدد / التسمية">
            <TextInput value={draft.count} onChange={(e) => setDraft((prev) => ({ ...prev, count: e.target.value }))} />
          </Field>
          <Field label="صورة التصنيف (من الجهاز)">
            <TextInput
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </Field>

          <Field label="أو رابط الصورة (اختياري)">
            <TextInput
              value={draft.image}
              onChange={(e) => setDraft((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </Field>
          <Field label="الكاتب / العميل">
            <TextInput value={draft.author} onChange={(e) => setDraft((prev) => ({ ...prev, author: e.target.value }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="اقتباس التقييم">
              <TextTextarea
                rows={3}
                value={draft.quote}
                onChange={(e) => setDraft((prev) => ({ ...prev, quote: e.target.value }))}
              />
            </Field>
            <p className="mt-2 text-xs text-muted">ملاحظة: يمكنك رفع صورة من الجهاز، أو إدخال رابط مباشر إذا رغبت.</p>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <PrimaryButton type="submit">{editingIndex === null ? 'إضافة التصنيف' : 'حفظ التعديل'}</PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setEditingIndex(null);
                setDraft(resetDraft());
                setImageFile(null);
              }}
              className="rounded-xl border border-border-copper bg-transparent px-3 py-2 text-sm text-muted hover:text-copper-bright"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="قائمة التصنيفات الحالية">
        {loading ? (
          <p className="text-sm text-muted">جاري تحميل التصنيفات...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item, index) => (
              <div key={item.id ?? `${item.title}-${index}`} className={`${softCardClass} overflow-hidden`}>
                <img src={item.image || defaultCategories[0].image} alt={item.title} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-copper-bright">{item.title}</h3>
                    <Badge tone="copper">{item.count}</Badge>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-muted">“{item.quote}”</p>
                  <p className="text-xs text-muted">{item.author}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="rounded-xl border border-border-copper bg-transparent px-3 py-2 text-xs text-muted hover:text-copper-bright"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:border-red-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
