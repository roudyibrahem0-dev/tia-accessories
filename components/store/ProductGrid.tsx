'use client';

import { useMemo, useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { accessoryCategories, normalizeAccessoryCategory } from '@/lib/accessories';
import type { Product } from '@/lib/types';

type SortKey = 'newest' | 'price-asc' | 'price-desc';

type ProductGridProps = {
  products: Product[];
  loading: boolean;
  onAdd: (product: Product, quantity: number) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
};

export function ProductGrid({ products, loading, onAdd, selectedCategory, onCategoryChange }: ProductGridProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [material, setMaterial] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>(accessoryCategories);
    products.forEach((p) => {
      if (p.category) set.add(normalizeAccessoryCategory(p.category));
    });
    return Array.from(set);
  }, [products]);

  const fallbackProducts: Product[] = [
    { id: -1, name: 'طوق اللؤلؤ الناعم', price: 16, material: 'فضة إسترلينية 925', color_finish: 'فضي', image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85', category: 'أطواق' },
    { id: -2, name: 'أقراط اللمعة', price: 18, material: 'مطلي ذهب', color_finish: 'ذهبي', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85', category: 'أقراط' },
    { id: -3, name: 'خاتم التوأم', price: 24, material: 'ستانلس ستيل', color_finish: 'روز غولد', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85', category: 'خواتم' },
    { id: -4, name: 'سوار اللؤلؤ', price: 28, material: 'ستانلس ستيل', color_finish: 'فضي', image_url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=85', category: 'أساور' },
  ];

  const materials = useMemo(() => {
    const values = new Set<string>();
    (products.length ? products : fallbackProducts).forEach((product) => {
      if (product.material) values.add(product.material);
    });
    return Array.from(values);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.length ? [...products] : fallbackProducts;

    if (selectedCategory !== 'all') {
      list = list.filter((p) => normalizeAccessoryCategory(p.category) === selectedCategory);
    }

    if (material !== 'all') {
      list = list.filter((p) => p.material === material);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => [p.name, p.material, p.category, p.color_finish].some((value) => String(value || '').toLowerCase().includes(q)));
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'newest') list.sort((a, b) => b.id - a.id);

    return list;
  }, [products, query, sort, selectedCategory, material]);

  return (
    <section id="products" className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold text-[#8f61c2]">مختاراتنا لك</p>
          <h2 className="script-heading text-4xl font-normal text-[#2b1b36] sm:text-5xl">أحدث القطع</h2>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحثي عن قطعة..."
            className="w-full flex-1 rounded-full border border-[#6e4587]/15 bg-white px-4 py-2.5 text-sm text-[#2b1b36] outline-none placeholder:text-muted focus:border-copper"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="min-w-0 w-full rounded-full border border-[#6e4587]/15 bg-white px-3 py-2.5 text-sm text-[#2b1b36] outline-none focus:border-copper sm:w-auto"
            >
              <option value="all">كل الفئات</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="min-w-0 w-full rounded-full border border-[#6e4587]/15 bg-white px-3 py-2.5 text-sm text-[#2b1b36] outline-none focus:border-copper sm:w-auto"
            >
              <option value="all">كل المواد</option>
              {materials.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="min-w-0 w-full rounded-full border border-[#6e4587]/15 bg-white px-3 py-2.5 text-sm text-[#2b1b36] outline-none focus:border-copper sm:w-auto"
            >
              <option value="newest">الأحدث</option>
              <option value="price-asc">السعر الأقل</option>
              <option value="price-desc">السعر الأعلى</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-muted">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">لا توجد قطع حالياً.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((product) => (
              <article key={product.id} className="group relative min-w-0">
                <div className="relative overflow-hidden rounded-2xl bg-[#eee5f2]">
                  <img src={product.image_url || ''} alt={product.name} className="aspect-[0.86] w-full object-cover transition duration-500 group-hover:scale-105" />
                  <button type="button" className="absolute start-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#6d4c7f] shadow-sm" aria-label="إضافة إلى المفضلة">
                    <Heart size={17} strokeWidth={1.6} />
                  </button>
                </div>
                <div className="px-1 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 text-sm font-semibold leading-6 text-[#2b1b36] sm:text-base">{product.name}</h3>
                    <span className="shrink-0 text-sm font-bold text-[#7540a8]">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <button type="button" onClick={() => onAdd(product, 1)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#8f61c2]/30 py-2 text-xs font-semibold text-[#7540a8] transition hover:bg-[#8f61c2] hover:text-white">
                    <ShoppingBag size={14} /> أضيفي للسلة
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded-full bg-[#eee5f2] px-2 py-1 text-[#5d4770]">{product.material || 'مادة مختارة'}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">✓ مقاوم للصدأ</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
