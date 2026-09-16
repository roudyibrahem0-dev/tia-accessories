'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { accessoryCategoryFromSlug } from '@/lib/accessories';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { useParams } from 'next/navigation';

type SortKey = 'newest' | 'price-asc' | 'price-desc';

type CategoryProduct = Product & {
  image_url?: string | null;
  color_finish?: string | null;
};

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const category = accessoryCategoryFromSlug(params.slug || '');
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('id', { ascending: false });
      if (active) {
        setProducts((data || []) as CategoryProduct[]);
        setLoading(false);
      }
    }
    loadProducts();
    return () => { active = false; };
  }, [category]);

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('ar');
    const result = products.filter((product) => {
      if (!value) return true;
      return [product.name, product.material, product.category, product.color_finish]
        .some((field) => String(field || '').toLocaleLowerCase('ar').includes(value));
    });
    if (sort === 'price-asc') result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'newest') result.sort((a, b) => Number(b.id) - Number(a.id));
    return result;
  }, [products, query, sort]);

  return (
    <main className="circuit-bg min-h-screen px-4 py-8 text-[#2b1b36]" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-[#7540a8] no-underline">← العودة للمتجر</Link>
            <h1 className="script-heading mt-3 text-5xl text-[#2b1b36]">{category}</h1>
            <p className="mt-2 text-sm text-[#75687d]">تصفحي أحدث قطع {category}</p>
          </div>
          <Link href="/#products" className="rounded-full border border-[#8f61c2]/30 px-4 py-2 text-sm text-[#7540a8] no-underline">كل المنتجات</Link>
        </div>

        <div className="mb-7 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحثي بالاسم أو المادة أو اللون..."
            className="w-full flex-1 rounded-full border border-[#6e4587]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#8f61c2]"
          />
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-full border border-[#6e4587]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#8f61c2]">
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر من الأقل</option>
            <option value="price-desc">السعر من الأعلى</option>
          </select>
        </div>

        {loading ? <p className="py-16 text-center text-[#75687d]">جاري تحميل المنتجات...</p> : null}
        {!loading && filtered.length === 0 ? <p className="py-16 text-center text-[#75687d]">لا توجد منتجات في هذه الفئة حالياً.</p> : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <article key={product.id} className="group min-w-0">
              <div className="relative overflow-hidden rounded-2xl bg-[#eee5f2]">
                {product.image_url ? <img src={product.image_url} alt={product.name} className="aspect-[0.86] w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="aspect-[0.86]" />}
                <button type="button" className="absolute start-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#6d4c7f]" aria-label="إضافة إلى المفضلة"><Heart size={17} /></button>
              </div>
              <div className="px-1 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold leading-6 sm:text-base">{product.name}</h2>
                  <span className="shrink-0 text-sm font-bold text-[#7540a8]">${Number(product.price).toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-[#75687d]">{product.material || 'مادة غير محددة'} {product.color_finish ? ` · ${product.color_finish}` : ''}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">✓ مقاوم للصدأ</span>
                  <span className="rounded-full bg-[#eee5f2] px-2 py-1 text-[#5d4770]">{Number(product.stock_qty || 0) > 0 ? 'متوفر' : 'غير متوفر'}</span>
                </div>
                <Link href="/#products" className="mt-3 flex items-center justify-center gap-2 rounded-full border border-[#8f61c2]/30 py-2 text-xs font-semibold text-[#7540a8] no-underline"><ShoppingBag size={14} /> أضيفي للسلة</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
