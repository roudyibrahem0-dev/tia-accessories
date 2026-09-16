'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/store/Header';
import { Hero } from '@/components/store/Hero';
import { Categories } from '@/components/store/Categories';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Services } from '@/components/store/Services';
import { CartDrawer } from '@/components/store/CartDrawer';
import { addCartItem, readCartFromStorage, removeCartItem, updateCartItemQuantity, writeCartToStorage } from '@/lib/cart';
import {
  buildCheckoutItems,
  getCouponValue,
  validateCheckoutInput,
  validateCouponForOrder,
} from '@/lib/checkout';
import { getProductFinalPrice, isCouponValid, roundMoney } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import type { CartItem, Coupon, Product } from '@/lib/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => readCartFromStorage());
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    writeCartToStorage(cart);
  }, [cart]);

  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true);
      const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
      const list = ((data || []) as Product[]).filter((p) => p.is_active !== false);
      setProducts(list);
      setLoadingProducts(false);
    }
    fetchProducts();
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + getProductFinalPrice(item) * item.quantity, 0),
    [cart],
  );

  const couponDiscount = useMemo(() => getCouponValue(appliedCoupon, subtotal), [appliedCoupon, subtotal]);

  const totalPrice = Math.max(0, roundMoney(subtotal - couponDiscount));
  function addToCart(product: Product, quantity: number) {
    setCart((prev) => addCartItem(prev, product, quantity));
    setCartOpen(true);
  }

  function removeFromCart(index: number) {
    setCart((prev) => removeCartItem(prev, index));
  }

  function updateCartQuantity(index: number, quantity: number) {
    setCart((prev) => updateCartItemQuantity(prev, index, quantity));
  }

  async function applyCoupon() {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('أدخل كود الخصم');
      return;
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setAppliedCoupon(null);
      setCouponError('الكود غير موجود أو جدول الخصومات غير مفعّل بعد');
      return;
    }

    const coupon = data as Coupon;
    const invalid = isCouponValid(coupon, subtotal);
    if (invalid) {
      setAppliedCoupon(null);
      setCouponError(invalid);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponError('');
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateCheckoutInput({
      cart,
      customerName,
      phone,
      location,
      appliedCoupon,
      subtotal,
    });

    if (!validation.ok) {
      if (validation.message) alert(validation.message);
      if (validation.message && appliedCoupon) setCouponError(validation.message);
      return;
    }

    setCheckoutLoading(true);

    const items = buildCheckoutItems(cart);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName,
          phone,
          email,
          items,
          totalPrice,
          address: location,
          details: appliedCoupon ? `كود الخصم: ${appliedCoupon.code} | قيمة الخصم: ${couponDiscount}` : '',
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'تعذر إرسال الطلب');

      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: Number(appliedCoupon.used_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }

      alert('تم إرسال طلبك بنجاح!');
      setCart([]);
      setCustomerName('');
      setPhone('');
      setEmail('');
      setLocation('');
      removeCoupon();
      setCartOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('حدث خطأ أثناء إتمام الطلب: ' + message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="store-shell circuit-bg min-h-screen text-[#2b1b36]" dir="rtl">
      <Header cartCount={cart.length} onOpenCart={() => setCartOpen(true)} />
      <main>
        <Hero />
        <Categories products={products} />
        <ProductGrid
          products={products}
          loading={loadingProducts}
          onAdd={addToCart}
          selectedCategory="all"
          onCategoryChange={() => undefined}
        />
        <Services />
      </main>

      <footer className="mt-8 bg-[#2b1b36] px-4 py-10 text-center text-[#eee4f5]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
          <img src="/161095.png" alt="Tia Accessories" className="logo-img h-auto w-72 object-contain sm:w-80" />
          <div className="text-2xl text-[#dcbcff]">♡</div>
          <p className="text-sm text-[#cdbbd8]">أناقتك تبدأ من التفاصيل.</p>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        cart={cart}
        customerName={customerName}
        phone={phone}
        email={email}
        location={location}
        couponCode={couponCode}
        appliedCoupon={appliedCoupon}
        couponError={couponError}
        couponDiscount={couponDiscount}
        loading={checkoutLoading}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onQuantityChange={updateCartQuantity}
        onCustomerNameChange={setCustomerName}
        onPhoneChange={setPhone}
        onEmailChange={setEmail}
        onLocationChange={setLocation}
        onCouponCodeChange={setCouponCode}
        onApplyCoupon={applyCoupon}
        onRemoveCoupon={removeCoupon}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
