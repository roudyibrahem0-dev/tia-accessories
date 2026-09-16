'use client';

import { Heart, Menu, Search, ShoppingBag, UserRound } from 'lucide-react';

type HeaderProps = {
  cartCount: number;
  onOpenCart: () => void;
};

export function Header({ cartCount, onOpenCart }: HeaderProps) {
  return (
    <header className="relative z-40 border-b border-[#6e4587]/10 bg-[#f9f2fc]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <button type="button" className="flex h-10 w-10 items-center justify-center text-[#2b1b36] sm:hidden" aria-label="القائمة">
          <Menu size={22} strokeWidth={1.7} />
        </button>
        <a href="#home" className="text-center leading-none no-underline">
          <img src="/161095.png" alt="Tia Accessories" className="logo-img h-24 w-48 object-contain sm:h-28 sm:w-56" />
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#2b1b36] sm:flex">
          <a href="#products" className="hover:text-copper-deep">جديدنا</a>
          <a href="#categories" className="hover:text-copper-deep">قلادات</a>
          <a href="#categories" className="hover:text-copper-deep">خواتم</a>
          <a href="#categories" className="hover:text-copper-deep">أقراط</a>
          <a href="#categories" className="text-copper-deep">المجموعات</a>
          <a href="#services" className="hover:text-copper-deep">من نحن</a>
        </nav>
        <div className="flex items-center gap-2 text-[#2b1b36] sm:gap-3">
          <button type="button" className="hidden h-10 w-10 items-center justify-center sm:flex" aria-label="بحث"><Search size={19} strokeWidth={1.6} /></button>
          <button type="button" className="hidden h-10 w-10 items-center justify-center sm:flex" aria-label="المفضلة"><Heart size={19} strokeWidth={1.6} /></button>
          <button type="button" className="hidden h-10 w-10 items-center justify-center sm:flex" aria-label="الحساب"><UserRound size={19} strokeWidth={1.6} /></button>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex h-10 w-10 items-center justify-center text-[#2b1b36] transition hover:text-copper-deep"
            aria-label="السلة"
          >
            <ShoppingBag size={19} strokeWidth={1.6} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.52 3.48A11.89 11.89 0 0 0 12.08 0C5.54 0 0.18 5.37 0.18 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64A11.94 11.94 0 0 0 12.08 24c6.54 0 11.9-5.37 11.9-11.93 0-3.18-1.24-6.17-3.46-8.59ZM12.08 21.8c-1.92 0-3.8-.52-5.44-1.5l-.39-.23-3.72.97 1-3.63-.25-.38A9.88 9.88 0 0 1 2.2 11.93c0-5.48 4.4-9.9 9.88-9.9 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.92 7.01c0 5.48-4.4 9.9-9.9 9.9Zm5.42-7.42c-.29-.15-1.73-.85-1.99-.95-.26-.1-.45-.15-.64.15-.19.3-.73.95-.9 1.14-.17.19-.33.21-.61.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.5.15-.17.2-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.54-.88-2.1-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.34-.27.27-1.02 1-1.02 2.45 0 1.45 1.05 2.84 1.2 3.04.15.2 2.06 3.15 5 4.41.7.3 1.25.48 1.68.61.71.23 1.35.2 1.85.12.56-.08 1.73-.71 1.97-1.39.24-.69.24-1.28.17-1.4-.07-.12-.26-.19-.55-.34Z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V7.4c0-.9.3-1.6 1.7-1.6H17V2.9c-.3-.1-1.3-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.6H7.5V14h2.5v8h3.5Z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4"/>
      <circle cx="12" cy="12" r="4.2"/>
      <circle cx="17.1" cy="6.9" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  );
}
