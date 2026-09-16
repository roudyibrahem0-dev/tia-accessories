'use client';

export function Hero() {
  return (
    <section id="home" className="hero-purple relative overflow-hidden px-5 py-16 text-right text-white sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 sm:grid-cols-[1fr_0.8fr]">
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold text-[#dcbcff]">إكسسوارات تعبّر عنك</p>
          <h1 className="script-heading max-w-lg text-5xl leading-[1.1] sm:text-7xl">أكثر من مجرد إكسسوارات... إنها أسلوبك ♡</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#eadff0] sm:text-base">اختاري القطعة التي تشبهك وأضيفي لمسة من الجمال إلى كل إطلالة.</p>
          <a href="#products" className="copper-btn mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm no-underline">تسوّقي الآن <span aria-hidden>←</span></a>
          <ul className="mt-7 grid gap-2 text-sm text-[#f0e6f6] sm:grid-cols-3 sm:gap-4">
            <li>✦ جودة عالية</li>
            <li>✦ تصاميم عصرية</li>
            <li>✦ توصيل لجميع المناطق</li>
          </ul>
        </div>
        <div className="flex justify-center sm:justify-end">
          <img src="/161095.png" alt="Tia Accessories" className="logo-img h-auto w-full max-w-[420px] object-contain sm:max-w-[540px]" />
        </div>
      </div>
    </section>
  );
}
