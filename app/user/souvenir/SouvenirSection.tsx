'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ** Mock Data สำหรับของที่ระลึก **
export const souvenirMockData = {
  featured: [
    {
      id: 1,
      title: 'ลงทะเบียนเข้าร่วมกิจกรรม ENGi Day',
      description:
        "รับ ‘เข็มกลัด We are SUT’ เป็นของที่ระลึกสุดพิเศษ สำหรับผู้เข้าร่วมงานเท่านั้น",
      imageSrc: '/souvenir/EngiButton.png',
      href: '/auth/register',
    },
    {
      id: 2,
      title: 'บริจาคเพื่อสนับสนุน ENGi',
      description: 'รับหมวก ENGi Cap แทนคำขอบคุณ',
      imageSrc: '/souvenir/EngiCap.png',
      href: '/user/donation',
    },
    {
      id: 3,
      title: 'ของที่ระลึกประจำปี SUT',
      description: 'สะท้อนความเรียบ เท่ และยั่งยืน สำหรับผู้สนับสนุนโครงการ',
      imageSrc: '/souvenir/EngiBrooch.png',
      href: '/user/souvenir',
    },
  ],
};

export function SouvenirSection() {
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

  // (Removed interval autoplay; continuous RAF scrolling handles auto movement)

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
          className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 bg-gray-50/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors hidden md:block"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 bg-gray-50/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors hidden md:block"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        {/* แถบโปรโมต 3 บล็อกแบบเลื่อนต่อเนื่อง */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative overflow-hidden max-w-7xl mx-auto"
        >
          <div ref={trackRef} className="flex gap-12 will-change-transform">
            {loopItems.map((item, idx) => (
              <Link key={`${item.id}-${idx}`} href={item.href} className="group block basis-full md:basis-1/3 shrink-0">
                <div className="flex flex-col items-center text-center">
                  {/* รูปหลัก */}
                  <div className="relative w-full h-96 md:h-[420px] bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gray-200">
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      priority={idx % featured.length === 1}
                      className={'object-contain'}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  {/* ข้อความโปรโมต */}
                  <h3 className="mt-6 text-xl md:text-2xl font-medium text-orange-600">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm md:text-base text-gray-500 max-w-md">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SouvenirSection;
