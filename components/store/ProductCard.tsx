'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getProductFinalPrice, money } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { Product, ProductReview } from '@/lib/types';

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product, quantity: number) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { t } = useI18n();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const finalPrice = getProductFinalPrice(product);
  const hasDiscount = Boolean(product.discount_active && finalPrice < Number(product.price));
  const maxQuantity = Math.max(1, Number(product.stock_qty ?? 99));

  function updateQuantity(value: number) {
    setQuantity(Math.min(maxQuantity, Math.max(1, Math.trunc(value) || 1)));
  }

  const mediaItems = (() => {
    const raw = Array.isArray(product.gallery_images)
      ? product.gallery_images
      : typeof product.gallery_images === 'string'
        ? product.gallery_images
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const items = raw.length > 0 ? raw : product.image_url ? [product.image_url] : [];
    return items.filter((item, index, array) => item && array.indexOf(item) === index);
  })();

  const coverImage = mediaItems[0] || product.image_url || '';
  const showVideo = Boolean(product.video_url);
  const previewImages = showVideo ? [product.video_url || '', ...mediaItems] : mediaItems;
  const filteredPreviewImages = previewImages.filter(Boolean);
  const previewActiveItem = filteredPreviewImages[previewIndex] || filteredPreviewImages[0];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const openPreviewAt = async (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });

    if (!error) setReviews((data || []) as ProductReview[]);
  };

  const goToNext = () => {
    if (!filteredPreviewImages.length) return;
    setPreviewIndex((prev) => (prev + 1) % filteredPreviewImages.length);
  };

  const goToPrev = () => {
    if (!filteredPreviewImages.length) return;
    setPreviewIndex((prev) => (prev - 1 + filteredPreviewImages.length) % filteredPreviewImages.length);
  };

  async function fetchReviews() {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });

    if (!error) setReviews((data || []) as ProductReview[]);
  }

  async function uploadReviewFiles(files: File[]) {
    const uploaded: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (!error) {
        const url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        uploaded.push(url);
      }
    }

    return uploaded;
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewComment.trim()) {
      alert('اكتب تعليق قبل النشر');
      return;
    }

    setReviewSubmitting(true);
    try {
      const uploadedImages = await uploadReviewFiles(reviewFiles);

      const { error } = await supabase.from('product_reviews').insert([
        {
          product_id: product.id,
          customer_name: reviewName.trim() || 'زبون',
          rating: reviewRating,
          comment: reviewComment.trim(),
          image_urls: uploadedImages,
        },
      ]);

      if (error) {
        console.error('Review insert failed:', error);
        alert(error.message || 'فشل في نشر المراجعة');
        return;
      }

      setReviewName('');
      setReviewRating(5);
      setReviewComment('');
      setReviewFiles([]);
      await fetchReviews();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Review submit error:', err);
      alert('خطأ أثناء نشر المراجعة: ' + message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <>
      <article
        className="glass-card group flex cursor-pointer flex-col overflow-hidden rounded-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(76,38,64,0.16)]"
        onClick={() => openPreviewAt(0)}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f3e8ed] sm:aspect-square">
          {showVideo ? (
            <video
              src={product.video_url || undefined}
              poster={coverImage || undefined}
              controls
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1410] to-[#0e0e14]">
              <span className="text-5xl font-black text-copper/40">M</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#32142f]/35 via-transparent to-transparent" />
          {showVideo ? (
            <span className="absolute start-2 top-2 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[9px] font-black text-white sm:start-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
              فيديو
            </span>
          ) : null}
          {hasDiscount ? (
            <span className="absolute start-2 top-2 rounded-full bg-copper px-1.5 py-0.5 text-[9px] font-black text-[#1a1008] sm:start-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
              {t.sale}
              {product.discount_type === 'percent' ? ` ${product.discount_value}%` : ''}
            </span>
          ) : null}
        </div>

        {mediaItems.length > 1 || showVideo ? (
          <div className="grid grid-cols-4 gap-2 border-t border-white/5 bg-[#0a0a10] p-2">
            {mediaItems.slice(0, 4).map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPreviewAt(showVideo ? index + 1 : index);
                }}
                className="overflow-hidden rounded-lg border border-border-copper/50 bg-[#121218]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item} alt={`${product.name} ${index + 1}`} className="h-14 w-full object-cover" />
              </button>
            ))}
            {showVideo && !mediaItems.includes(product.video_url || '') ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPreviewAt(0);
                }}
                className="flex items-center justify-center overflow-hidden rounded-lg border border-red-500/40 bg-[#121218] text-[10px] font-bold text-red-200"
              >
                فيديو
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
          <div>
            <h3 className="mb-1 truncate text-sm font-normal text-[#351330] sm:text-base">{product.name}</h3>
            {product.description ? (
              <p className="mb-1 hidden line-clamp-2 text-xs text-muted sm:block">{product.description}</p>
            ) : null}
            <p className="break-words text-[11px] text-muted sm:text-xs">
              {product.material || 'مادة غير محددة'}
              {product.color_finish ? ` · ${product.color_finish}` : ''}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {hasDiscount ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted line-through sm:text-sm">{money(Number(product.price))}</span>
                  <span className="text-base font-extrabold text-copper-bright sm:text-lg">{money(finalPrice)}</span>
                </div>
              ) : (
                <div className="text-base font-normal text-[#351330] sm:text-lg">{money(Number(product.price))}</div>
              )}
              <div className="flex items-center gap-1 text-[11px] text-copper/80">
                <span>{'★'.repeat(Math.round(averageRating || 0)) || '★'}</span>
                <span className="text-[10px] text-muted">({reviews.length || 0})</span>
              </div>
            </div>
            <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center rounded-full border border-border-copper bg-[#101015]">
                <button type="button" onClick={() => updateQuantity(quantity - 1)} className="px-1.5 py-1.5 text-copper-bright sm:px-2 sm:py-2" aria-label="تقليل الكمية">-</button>
                <input type="number" min="1" max={maxQuantity} value={quantity} onChange={(event) => updateQuantity(Number(event.target.value))} className="w-8 bg-transparent text-center text-[11px] font-bold text-white outline-none sm:w-9 sm:text-xs" aria-label="الكمية" />
                <button type="button" onClick={() => updateQuantity(quantity + 1)} className="px-1.5 py-1.5 text-copper-bright sm:px-2 sm:py-2" aria-label="زيادة الكمية">+</button>
              </div>
              <button type="button" onClick={() => onAdd(product, quantity)} className="copper-btn flex-1 rounded-full px-2 py-1.5 text-[10px] sm:flex-none sm:px-3 sm:py-2 sm:text-sm">{t.addToCart}</button>
            </div>
          </div>
        </div>
      </article>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-border-copper bg-[#101015] shadow-[0_0_50px_rgba(160,95,40,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute end-3 top-3 z-10 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-sm text-white"
            >
              ✕
            </button>

            <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
              <div className="relative bg-black">
                {previewActiveItem && previewActiveItem.endsWith('.mp4') || previewActiveItem?.includes('video') ? (
                  <video src={previewActiveItem} controls autoPlay playsInline className="h-full max-h-[70vh] w-full object-cover" />
                ) : previewActiveItem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewActiveItem} alt={product.name} className="h-full max-h-[70vh] w-full object-cover" />
                ) : (
                  <div className="flex h-[320px] items-center justify-center bg-gradient-to-br from-[#1a1410] to-[#0e0e14] text-6xl font-black text-copper/40">
                    M
                  </div>
                )}

                {filteredPreviewImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-lg text-white"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-lg text-white"
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>

              <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-5 md:p-6">
                <div>
                  <p className="mb-2 text-xs font-bold tracking-[0.25em] text-copper">{t.productGrid}</p>
                  <h3 className="text-2xl font-black text-white">{product.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-copper-bright">{money(Number(product.price))}</span>
                  {hasDiscount ? (
                    <span className="text-sm text-muted line-through">{money(Number(product.price))}</span>
                  ) : null}
                </div>

                <p className="text-sm leading-7 text-muted">{product.description || 'لا يوجد وصف متاح حالياً.'}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                  <span>المادة: {product.material || '—'}</span>
                  <span>اللون واللمسة: {product.color_finish || '—'}</span>
                  <span>التوفر: {Number(product.stock_qty || 0) > 0 ? 'متوفر' : 'غير متوفر'}</span>
                  <span>العناية: {product.care_instructions || 'تجنبي العطور والماء للحفاظ على اللمعان.'}</span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  ✓ {product.warranty_text || 'مقاوم للصدأ ولا يتغير لونه مع الماء'}
                </div>

                {previewImages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {filteredPreviewImages.slice(0, 4).map((item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() => {
                          const actualIndex = filteredPreviewImages.indexOf(item);
                          if (actualIndex >= 0) {
                            setPreviewIndex(actualIndex);
                          }
                        }}
                        className="overflow-hidden rounded-xl border border-border-copper/60 bg-[#121218]"
                      >
                        {item.includes('mp4') || item.includes('video') ? (
                          <div className="flex h-20 items-center justify-center bg-red-500/10 text-[10px] font-black text-red-200">
                            فيديو
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item} alt={`${product.name} ${index + 1}`} className="h-20 w-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-border-copper bg-[#101015] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-black text-copper-bright">المراجعات ({reviews.length})</h4>
                    <span className="text-xs text-copper-bright">
                      {reviews.length ? `${averageRating.toFixed(1)}/5` : 'لا توجد مراجعات'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <p className="text-xs text-muted">لا توجد مراجعات لهذا المنتج بعد.</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-white/10 bg-[#0d0d12] p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <strong className="text-sm text-white">{review.customer_name}</strong>
                            <span className="text-xs text-copper-bright">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          </div>
                          <p className="text-sm leading-6 text-muted">{review.comment}</p>
                          {review.image_urls && review.image_urls.length > 0 ? (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {review.image_urls.map((url, i) => (
                                <div key={`${url}-${i}`} className="overflow-hidden rounded-xl border border-white/10 bg-[#15161b]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={`review-${i}`} className="h-24 w-full object-cover transition duration-300 hover:scale-105" />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-border-copper bg-[#101015] p-3">
                  <h4 className="mb-3 text-sm font-black text-copper-bright">أضف مراجعتك</h4>
                  <div className="grid gap-3">
                    <input
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="اسمك (اختياري)"
                      className="rounded-xl border border-border-copper bg-[#0d0d12] px-3 py-2 text-sm text-white outline-none"
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="rounded-xl border border-border-copper bg-[#0d0d12] px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value={5}>5 نجوم</option>
                      <option value={4}>4 نجوم</option>
                      <option value={3}>3 نجوم</option>
                      <option value={2}>2 نجوم</option>
                      <option value={1}>1 نجمة</option>
                    </select>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="اكتب تعليقك عن المنتج..."
                      className="rounded-xl border border-border-copper bg-[#0d0d12] px-3 py-2 text-sm text-white outline-none"
                    />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setReviewFiles(Array.from(e.target.files || []))}
                      className="text-sm text-muted"
                    />
                    <button type="submit" disabled={reviewSubmitting} className="copper-btn rounded-full px-4 py-2 text-sm font-bold disabled:opacity-60">
                      {reviewSubmitting ? 'جاري النشر...' : 'نشر المراجعة'}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between rounded-xl border border-border-copper bg-[#101015] p-3">
                  <span className="text-sm font-bold text-white">الكمية</span>
                  <div className="flex items-center rounded-lg border border-border-copper">
                    <button type="button" onClick={() => updateQuantity(quantity - 1)} className="px-3 py-2 text-copper-bright" aria-label="تقليل الكمية">-</button>
                    <input type="number" min="1" max={maxQuantity} value={quantity} onChange={(event) => updateQuantity(Number(event.target.value))} className="w-10 bg-transparent text-center text-sm font-bold text-white outline-none" aria-label="الكمية" />
                    <button type="button" onClick={() => updateQuantity(quantity + 1)} className="px-3 py-2 text-copper-bright" aria-label="زيادة الكمية">+</button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen(false);
                    onAdd(product, quantity);
                  }}
                  className="copper-btn mt-auto rounded-full px-4 py-3 text-sm font-bold"
                >
                  {t.addToCart}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
