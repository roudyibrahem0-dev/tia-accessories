import type { Coupon, Product } from './types';

export function roundMoney(value: number) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
export function getProductFinalPrice(product: Product) {
  const price = Number(product.price || 0);
  if (!product.discount_active) return price;
  const value = Number(product.discount_value || 0);
  return roundMoney(product.discount_type === 'percent' ? price * (1 - value / 100) : Math.max(0, price - value));
}
export function money(value: number) { return `${roundMoney(value).toFixed(2)} $`; }
export function getCouponValue(coupon: Coupon | null, subtotal: number) {
  if (!coupon) return 0;
  const value = Number(coupon.discount_value || 0);
  return roundMoney(coupon.discount_type === 'percent' ? subtotal * value / 100 : Math.min(subtotal, value));
}
export function isCouponValid(coupon: Coupon, subtotal: number) {
  if (coupon.active === false) return 'كود الخصم غير فعال';
  if (Number(coupon.min_order || 0) > subtotal) return 'قيمة الطلب أقل من الحد الأدنى للخصم';
  return '';
}
