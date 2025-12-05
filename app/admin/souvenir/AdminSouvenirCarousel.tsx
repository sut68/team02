'use client';
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ** Mock Data สำหรับของที่ระลึก (Admin - ไม่มี href) **
type SouvenirItem = {
  id: number;
  title: string;
  stock: number;
  imageSrc: string;
};

export const souvenirMockData = {
  featured: [
    {
      id: 1,
      title: 'เข็มกลัด SUT',
      stock: 50,
      imageSrc: '/souvenir/EngiButton.png',
    },
    {
      id: 2,
      title: 'SUT Cap',
      stock: 50,
      imageSrc: '/souvenir/EngiCap.png',
    },
    {
      id: 3,
      title: 'ENGi Bottle',
      stock: 24,
      imageSrc: '/souvenir/EngiBottle.png',
    },
  ] as SouvenirItem[],
};

export function AdminSouvenirCarousel({ onCardClick }: { onCardClick?: (itemId: number) => void }) {
  const router = useRouter();
  const { featured } = souvenirMockData;
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(36); // px per second (slightly faster continuous)

  const stepBy = (px: number) => {
    const loopW = loopWidthRef.current || 0;
    if (loopW <= 0) return;
    offsetRef.current += px;
    while (offsetRef.current >= loopW) offsetRef.current -= loopW;
    while (offsetRef.current < 0) offsetRef.current += loopW;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }
  };

  const nextSlide = () => stepBy(cardWidthRef.current || 0);

  const prevSlide = () => stepBy(-(cardWidthRef.current || 0));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * 60; // smooth manual nudge
    stepBy(delta);
  };

  const loopItems = React.useMemo(() => [...featured, ...featured], [featured]);

  // Measure widths for seamless loop and step sizing
  React.useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;
      const fullWidth = track.scrollWidth;
      loopWidthRef.current = fullWidth / 2; // since items duplicated
      const cols = window.innerWidth >= 768 ? 3 : 1;
      cardWidthRef.current = container.clientWidth / cols;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Continuous auto-scroll using requestAnimationFrame
  React.useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!isPaused) {
        stepBy(speedRef.current * dt);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused]);

  return (
    <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-88px)] flex items-center">
      <div className="container mx-auto relative">
        {/* หัวข้อ */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800">ของที่ระลึก</h2>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-50/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors hidden md:block"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-50/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors hidden md:block"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        {/* แถบโปรโมต 3 บล็อกแบบเลื่อนต่อเนื่อง (ไม่มี Link) */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative overflow-hidden max-w-7xl mx-auto"
        >
          <div ref={trackRef} className="flex gap-12 will-change-transform items-end pb-8">
            {loopItems.map((item, idx) => {
              const isCenter = (idx % featured.length) === 1;
              return (
                <div 
                  key={`${item.id}-${idx}`} 
                  onClick={() => onCardClick?.(item.id)}
                  className={`group block basis-full md:basis-1/3 shrink-0 transition-transform duration-300 cursor-pointer ${isCenter ? 'md:scale-110 md:mb-4' : 'md:scale-100'}`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* รูปหลัก */}
                    <div className="relative w-full h-64 md:h-80 bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-0.5">
                      <Image
                        src={item.imageSrc}
                        alt={item.title}
                        fill
                        priority={isCenter}
                        className={'object-contain p-4'}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>

                    {/* ชื่อสินค้า */}
                    <h3 className="mt-4 text-lg md:text-xl font-bold text-orange-500">
                      {item.title}
                    </h3>
                    {/* จำนวนคงเหลือ */}
                    <p className="mt-1 text-sm text-gray-500">
                      จำนวนคงเหลือ: {item.stock} ชิ้น
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminSouvenirCarousel;
