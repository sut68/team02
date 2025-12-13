'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SouvenirItem {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  unit?: string;
  actionLabel?: string;
  actionHref?: string;
  requireAuth?: boolean;
}

export function SouvenirSection() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  // ตรวจสอบ authentication จาก cookies หรือ session
  React.useEffect(() => {
    // ตรวจสอบว่ามี session หรือไม่
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        setIsAuthenticated(!!data?.user);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);
  
  const [souvenirItems, setSouvenirItems] = React.useState<SouvenirItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // ดึงข้อมูลของที่ระลึกจาก API แบบ dynamic ไม่ hardcode หมวดหมู่
  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/souvenir/items');
        const items = await res.json();
        if (!Array.isArray(items)) {
          console.error('Souvenir items is not an array:', items);
          setLoading(false);
          return;
        }
        // สร้าง label/href อัตโนมัติตาม category
        const categoryMeta: Record<string, { label: string; href: string; requireAuth?: boolean; getDescription?: (name: string) => string }> = {
          'กิจกรรม': {
            label: 'ลงทะเบียนเข้าร่วมกิจกรรม',
            href: '/user/booking',
            getDescription: (name) => `รับ '${name}' เป็นของที่ระลึกสุดพิเศษ`,
          },
          'บริจาค': {
            label: 'บริจาคเพื่อสนับสนุน ENGi',
            href: '/user/donation',
            requireAuth: true,
            getDescription: (name) => `รับ ${name} แทนคำขอบคุณ`,
          },
        };
        // Dynamic category order (no hardcoding in filter)
        const categoryOrder = Object.keys(categoryMeta);
        const sortedItems = items
          .sort((a: any, b: any) => {
            const orderA = categoryOrder.indexOf(a.category) === -1 ? 999 : categoryOrder.indexOf(a.category);
            const orderB = categoryOrder.indexOf(b.category) === -1 ? 999 : categoryOrder.indexOf(b.category);
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
          })
          .map((item: any) => {
            const meta = categoryMeta[item.category] || { label: item.category || 'อื่นๆ', href: '#', getDescription: (name: string) => item.description || name };
            return {
              ...item,
              actionLabel: meta.label,
              actionHref: meta.href,
              description: item.description || (meta.getDescription ? meta.getDescription(item.name) : item.name),
              requireAuth: meta.requireAuth || false,
            };
          });
        setSouvenirItems(sortedItems);
      } catch (error) {
        console.error('Error fetching souvenir data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(36);

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
    const delta = Math.sign(e.deltaY) * 60;
    stepBy(delta);
  };

  const loopItems = React.useMemo(() => {
    if (souvenirItems.length === 0) return [];
    return [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems];
  }, [souvenirItems]);

  // Measure widths for seamless loop and step sizing
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    
    const measure = () => {
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;
      
      // Force a reflow to ensure scrollWidth is calculated
      track.offsetHeight;
      
      const fullWidth = track.scrollWidth;
      loopWidthRef.current = fullWidth / 4;
      const cols = window.innerWidth >= 768 ? 3 : 1;
      cardWidthRef.current = container.clientWidth / cols;
    };
    
    const timer = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [souvenirItems]);

  // Continuous auto-scroll using requestAnimationFrame
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    
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
  }, [isPaused, souvenirItems]);

  if (loading) {
    return (
      <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </section>
    );
  }

  if (souvenirItems.length === 0) {
    return (
      <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center text-gray-500">
          ยังไม่มีของที่ระลึกในขณะนี้
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-88px)] flex items-center">
      <div className="container mx-auto relative">
        {/* หัวข้อ */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">ของที่ระลึก</h2>
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
            {loopItems.map((item, idx) => {
              const finalHref = (item.requireAuth && !isAuthenticated) ? '/auth/login' : (item.actionHref || '#');
              return (
                <Link
                  key={`${item.id}-${idx}`}
                  href={finalHref}
                  className="group block basis-full md:basis-1/3 shrink-0"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* รูปหลัก */}
                    <div className="relative w-full h-96 md:h-[420px] bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gray-200">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          priority={idx % souvenirItems.length === 0}
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <p className="text-gray-400">ไม่มีรูปภาพ</p>
                        </div>
                      )}
                    </div>
                    {/* ข้อความโปรโมต */}
                    <h3 className="mt-6 text-xl md:text-2xl font-medium text-orange-600">
                      {item.actionLabel}
                    </h3>
                    <p className="mt-2 text-sm md:text-base text-gray-500 max-w-md">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SouvenirSection;
