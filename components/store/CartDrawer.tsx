'use client';

import { useI18n } from '@/lib/i18n';
import { getProductFinalPrice, money } from '@/lib/pricing';
import type { CartItem, Coupon } from '@/lib/types';

type CartDrawerProps = {
  open: boolean;
  cart: CartItem[];
  customerName: string;
  phone: string;
  email: string;
  location: string;
  couponCode: string;
  appliedCoupon: Coupon | null;
  couponError: string;
  couponDiscount: number;
  loading: boolean;
  onClose: () => void;
  onRemove: (index: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onCustomerNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onCheckout: (e: React.FormEvent) => void;
};

export function CartDrawer({
  open,
  cart,
  customerName,
  phone,
  email,
  location,
  couponCode,
  appliedCoupon,
  couponError,
  couponDiscount,
  loading,
  onClose,
  onRemove,
  onQuantityChange,
  onCustomerNameChange,
  onPhoneChange,
  onEmailChange,
  onLocationChange,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}: CartDrawerProps) {
  const { t } = useI18n();
  const subtotal = cart.reduce((sum, item) => sum + getProductFinalPrice(item) * item.quantity, 0);
  const totalPrice = Math.max(0, subtotal - couponDiscount);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 end-0 z-50 flex w-full flex-col border-s border-[#702765]/15 bg-[#fffdf9] text-[#351330] shadow-2xl transition-transform duration-300 sm:max-w-md ${
          open ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-[#702765]/15 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#351330]">{t.orderDetails}</h2>
            <p className="text-xs text-muted">
              {cart.reduce((total, item) => total + item.quantity, 0)} {t.items}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#702765]/15 px-3 py-1 text-sm text-muted hover:text-[#351330]"
          >
            {t.close}
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <p className="text-sm text-muted">{t.emptyCart}</p>
          ) : (
            cart.map((item, idx) => {
              const finalPrice = getProductFinalPrice(item);
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex flex-col gap-3 rounded-xl border border-[#702765]/10 bg-[#f3e8ed]/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#351330]">{item.name}</p>
                    <p className="text-xs text-muted">{item.material || 'إكسسوار'} · {item.color_finish || item.color || 'لون مختار'}</p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                    {finalPrice < Number(item.price) ? (
                      <div className="text-end">
                        <div className="text-[11px] text-muted line-through">{money(Number(item.price))}</div>
                        <div className="text-sm font-bold text-copper-bright">{money(finalPrice * item.quantity)}</div>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-copper-bright">{money(finalPrice * item.quantity)}</span>
                    )}
                    <div className="ms-auto flex items-center rounded-lg border border-border-copper">
                      <button type="button" onClick={() => onQuantityChange(idx, item.quantity - 1)} className="px-2 py-1 text-copper-bright" aria-label="تقليل الكمية">-</button>
                      <input type="number" min="1" max={Math.max(1, Number(item.stock_qty ?? 99))} value={item.quantity} onChange={(event) => onQuantityChange(idx, Number(event.target.value) || 1)} className="w-8 bg-transparent text-center text-xs text-white outline-none" aria-label={`كمية ${item.name}`} />
                      <button type="button" onClick={() => onQuantityChange(idx, item.quantity + 1)} className="px-2 py-1 text-copper-bright" aria-label="زيادة الكمية">+</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-sm text-red-400 hover:text-red-300"
                      aria-label={t.remove}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={onCheckout} className="space-y-3 border-t border-[#702765]/15 px-5 py-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{t.subtotal}</span>
            <span>{money(subtotal)}</span>
          </div>
          {couponDiscount > 0 ? (
            <div className="flex items-center justify-between text-sm text-copper-bright">
              <span>
                {t.couponDiscount}
                {appliedCoupon ? ` (${appliedCoupon.code})` : ''}
              </span>
              <span>−{money(couponDiscount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-base font-bold">
            <span>{t.totalPrice}</span>
            <span className="text-copper-bright">{money(totalPrice)}</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
              placeholder={t.couponPlaceholder}
              disabled={Boolean(appliedCoupon)}
              className="w-full rounded-xl border border-border-copper bg-[#0e0e14] px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-copper disabled:opacity-60"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="rounded-xl border border-border-copper px-3 text-xs text-muted hover:text-white"
              >
                {t.removeCoupon}
              </button>
            ) : (
              <button
                type="button"
                onClick={onApplyCoupon}
                className="rounded-xl border border-copper/50 px-3 text-xs font-bold text-copper-bright hover:bg-copper/10"
              >
                {t.applyCoupon}
              </button>
            )}
          </div>
          {couponError ? <p className="text-xs text-red-300">{couponError}</p> : null}
          {appliedCoupon ? <p className="text-xs text-emerald-300">{t.couponApplied}</p> : null}

          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="اسم الزبون"
            className="w-full rounded-xl border border-border-copper bg-[#0e0e14] px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-copper"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={t.phonePlaceholder}
            className="w-full rounded-xl border border-border-copper bg-[#0e0e14] px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-copper"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="البريد الإلكتروني (اختياري)"
            className="w-full rounded-xl border border-border-copper bg-[#0e0e14] px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-copper"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder={t.locationPlaceholder}
            className="w-full rounded-xl border border-border-copper bg-[#0e0e14] px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-copper"
          />
          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="copper-btn w-full rounded-xl px-4 py-3 text-sm"
          >
            {loading ? t.sending : t.checkout}
          </button>
        </form>
      </aside>
    </>
  );
}
