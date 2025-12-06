'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SouvenirItem = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  currentStock: number;
  unit?: string;
  active: boolean;
};

interface AdminSouvenirCarouselProps {
  onCardClick?: (itemId: number) => void;
  category?: string;
}

export function AdminSouvenirCarousel({ onCardClick, category }: AdminSouvenirCarouselProps) {
  const router = useRouter();
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(36);

  // Fetch souvenir items from API
  useEffect(() => {
    const fetchSouvenirItems = async () => {
      try {
        const res = await fetch('/api/admin/souvenir/items');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Filter by category if provided
            const filtered = category 
              ? data.filter((item: SouvenirItem) => item.category === category)
              : data;
            setSouvenirItems(filtered);
          }
        }
      } catch (error) {
        console.error('Error fetching souvenir items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSouvenirItems();
  }, [category]);

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
    // Create 4 copies for smooth infinite loop
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
      // Divided by 4 since we have 4x duplicates
      loopWidthRef.current = fullWidth / 4;
      const cols = window.innerWidth >= 768 ? 3 : 1;
      cardWidthRef.current = container.clientWidth / cols;
      
      console.log('Carousel measured:', { 
        fullWidth, 
        loopWidth: loopWidthRef.current, 
        cardWidth: cardWidthRef.current,
        itemsCount: souvenirItems.length 
      });
    };
    
    // Measure immediately and after a short delay to ensure DOM is ready
    measure();
    const timer = setTimeout(measure, 100);
    
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [souvenirItems.length]);

  // Continuous auto-scroll using requestAnimationFrame
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    if (isPaused) return;
    
    let rafId = 0;
    let last = performance.now();
    
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      
      const loopW = loopWidthRef.current;
      if (loopW > 0 && trackRef.current) {
        const distance = speedRef.current * dt;
        offsetRef.current += distance;
        while (offsetRef.current >= loopW) offsetRef.current -= loopW;
        while (offsetRef.current < 0) offsetRef.current += loopW;
        trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
      }
      
      rafId = requestAnimationFrame(tick);
    };
    
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, souvenirItems.length]);

  if (loading) {
    return (
      <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </section>
    );
  }

  if (souvenirItems.length === 0) {
    return (
      <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-gray-500">ไม่พบข้อมูลของที่ระลึก</div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-88px)] flex items-center">
      <div className="container mx-auto relative">
        {/* หัวข้อ */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {category === 'บริจาค' ? 'จัดการของที่ระลึกสำหรับโครงการบริจาค' : `ของที่ระลึก${category ? ` (${category})` : ''}`}
          </h2>
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
              const isCenter = (idx % souvenirItems.length) === 1;
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
                        src={item.imageUrl || '/souvenir/EngiButton.png'}
                        alt={item.name}
                        fill
                        priority={isCenter}
                        className={'object-contain p-4'}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>

                    {/* ชื่อสินค้า */}
                    <h3 className="mt-4 text-lg md:text-xl font-bold text-orange-500 truncate">
                      {item.name}
                    </h3>
                    {/* จำนวนคงเหลือ */}
                    <p className="mt-1 text-sm text-gray-500">
                      จำนวนคงเหลือ: {item.currentStock} {item.unit || 'ชิ้น'}
                    </p>
                    {/* สถานะ */}
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        item.active 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </div>
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
