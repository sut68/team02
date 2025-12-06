'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SouvenirItem {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  linkedEventId?: number;
  linkedEventName?: string;
  linkedEventHref?: string;
}

export function SouvenirSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(36);

  // Fetch souvenir items and their linked events
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active souvenir items
        const souvenirRes = await fetch('/api/admin/souvenir/items');
        if (!souvenirRes.ok) throw new Error('Failed to fetch souvenirs');
        const souvenirs = await souvenirRes.json();
        
        // Fetch events to find linked ones
        const eventsRes = await fetch('/api/admin/events');
        const events = eventsRes.ok ? await eventsRes.json() : [];
        
        // Filter only active items and map with event data
        const activeSouvenirs = souvenirs
          .filter((item: any) => item.active)
          .map((item: any) => {
            const linkedEvent = events.find((e: any) => e.souvenirItemId === item.id);
            return {
              id: item.id,
              sku: item.sku,
              name: item.name,
              description: item.description,
              category: item.category,
              imageUrl: item.imageUrl,
              linkedEventId: linkedEvent?.id,
              linkedEventName: linkedEvent?.name,
              linkedEventHref: linkedEvent ? `/user/booking/${linkedEvent.id}` : undefined,
            };
          });
        
        setSouvenirItems(activeSouvenirs);
      } catch (error) {
        console.error('Error fetching souvenir data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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

  // Duplicate items for infinite loop (4 copies for smooth scrolling)
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
      loopWidthRef.current = fullWidth / 4; // 4 copies
      const cols = window.innerWidth >= 768 ? 3 : 1;
      cardWidthRef.current = container.clientWidth / cols;
    };
    
    // Delay measurement to ensure images are loaded
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
              const href = item.linkedEventHref || '#';
              const requireAuth = item.category === 'บริจาค';
              const finalHref = requireAuth && !isAuthenticated ? '/auth/login' : href;
              
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
                          className="object-contain p-4"
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
                      {item.linkedEventName || item.name}
                    </h3>
                    <p className="mt-2 text-sm md:text-base text-gray-500 max-w-md">
                      {item.description || `รับ '${item.name}' เป็นของที่ระลึกสุดพิเศษ`}
                    </p>
                    {item.category && (
                      <span className="mt-2 text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                    )}
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
