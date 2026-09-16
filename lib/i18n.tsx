'use client';
import { createContext, useContext, type ReactNode } from 'react';
const translations = {
  orderDetails: 'تفاصيل الطلب', items: 'منتجات', close: 'إغلاق', emptyCart: 'السلة فارغة', remove: 'حذف', subtotal: 'المجموع الفرعي', couponDiscount: 'الخصم', totalPrice: 'الإجمالي', couponPlaceholder: 'رمز الخصم', removeCoupon: 'إزالة الرمز', applyCoupon: 'تطبيق', couponApplied: 'تم تطبيق الخصم', phonePlaceholder: 'رقم الهاتف', locationPlaceholder: 'العنوان', sending: 'جاري الإرسال...', checkout: 'تأكيد الطلب', sale: 'خصم', productGrid: 'تفاصيل المنتج', addToCart: 'أضف إلى السلة', searchPlaceholder: 'ابحثي عن منتج', allCategories: 'كل التصنيفات', sortNewest: 'الأحدث', sortPriceAsc: 'السعر من الأقل', sortPriceDesc: 'السعر من الأعلى', loading: 'جاري التحميل...', noProducts: 'لا توجد منتجات حالياً', products: 'المنتجات', services: 'خدماتنا', brand: 'Tia Accessories', tagline: 'أناقة خالدة مختارة بعناية.'
};
type Translation = typeof translations;
const Context = createContext<{ t: Translation }>({ t: translations });
export function I18nProvider({ children }: { children: ReactNode }) { return <Context.Provider value={{ t: translations }}>{children}</Context.Provider>; }
export function useI18n() { return useContext(Context); }
