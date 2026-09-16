'use client';

export function Services() {
  const items = [
    {
      title: 'توصيل سريع',
      desc: 'نوصل طلبك بأسرع وقت.',
      icon: '⌁',
    },
    {
      title: 'منتجات أصلية',
      desc: 'قطع مختارة بجودة موثوقة.',
      icon: '✦',
    },
    {
      title: 'دفع آمن',
      desc: 'بياناتك وطلبك بأمان.',
      icon: '◇',
    },
    {
      title: 'تغليف أنيق',
      desc: 'كل طلب يصل بتفاصيل جميلة.',
      icon: '♡',
    },
  ];

  return (
      <section id="services" className="border-y border-[#6e4587]/10 bg-[#f3ebf7] px-4 py-8 sm:py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.title}
                className="p-1 text-center"
            >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#2b1b36] text-lg text-[#dcbcff] sm:h-12 sm:w-12">
                {item.icon}
              </div>
                <h3 className="mb-1 text-xs font-bold text-[#2b1b36] sm:text-sm">{item.title}</h3>
                <p className="text-[11px] leading-5 text-muted sm:text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
