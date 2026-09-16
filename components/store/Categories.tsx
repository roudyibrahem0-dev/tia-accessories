'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { normalizeAccessoryCategory } from '@/lib/accessories';
import { accessoryCategorySlug } from '@/lib/accessories';
import Link from 'next/link';

type CategoryItem = {
  id?: number;
  title: string;
  count: string;
  image: string;
  quote: string;
  author: string;
  category?: string;
};

const defaultCategories: CategoryItem[] = [
  {
    title: 'أطواق',
    count: 'اكتشفي',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
    quote: 'تصاميم تضيف حضوراً ناعماً لإطلالتك.',
    author: 'Tia Accessories',
    category: 'أطواق',
  },
  {
    title: 'أقراط',
    count: 'اكتشفي',
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
    quote: 'لمعة صغيرة تصنع فرقاً كبيراً.',
    author: 'Tia Accessories',
    category: 'أقراط',
  },
  {
    title: 'خواتم',
    count: 'اكتشفي',
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
    quote: 'قطع تعبّر عن أسلوبك بثقة.',
    author: 'Tia Accessories',
    category: 'خواتم',
  },
  {
    title: 'أساور',
    count: 'اكتشفي',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
    quote: 'تفاصيل أنيقة ترافقك كل يوم.',
    author: 'Tia Accessories',
    category: 'أساور',
  },
  {
    title: 'خلاخل',
    count: 'اكتشفي',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
    quote: 'لمسة مرحة لإطلالتك الصيفية.',
    author: 'Tia Accessories',
    category: 'خلاخل',
  },
];

type CategoriesProps = {
  products: Product[];
};

export function Categories({ products }: CategoriesProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          setCategories((data as CategoryItem[]).map((item) => ({
            ...item,
            category: normalizeAccessoryCategory(item.category || item.title),
          })));
        } else {
          setCategories(defaultCategories);
        }
      } catch {
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <section id="categories" className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="script-heading text-4xl font-normal text-[#2b1b36] sm:text-5xl">تصفّحي حسب الفئة</h2>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted">جاري تحميل التصنيفات...</p>
        ) : null}

        <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          {categories.map((item, index) => (
            <Link
              key={item.id ?? `default-category-${index}`}
              href={`/category/${accessoryCategorySlug(item.category)}`}
              className="soft-purple-card min-w-[190px] snap-start overflow-hidden rounded-2xl text-start transition hover:-translate-y-1 sm:min-w-0"
            >
              <div className="relative">
                <img src={item.image} alt={item.title} className="h-40 w-full object-cover sm:h-44" />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2 p-3">
                  <h3 className="break-words text-base font-semibold text-[#2b1b36]">{item.title}</h3>
                  <span className="text-xs text-[#8f61c2]">{products.filter((product) => normalizeAccessoryCategory(product.category) === item.category).length || item.count} ←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
