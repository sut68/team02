'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABEL } from '@/constants/category';
import Image from 'next/image';
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
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [isPaused, setIsPaused] = useState(false);

  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const cardStepRef = useRef(0);
  const speedRef = useRef(36);

  // ---- fetch
  useEffect(() => {
    const fetchSouvenirItems = async () => {
      try {
        const res = await fetch('/api/admin/souvenir/items');
        if (!res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data)) return;

        const filtered = category ? data.filter((it: SouvenirItem) => it.category === category) : data;
        setSouvenirItems(filtered);
      } catch (error) {
        console.error('Error fetching souvenir items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSouvenirItems();
  }, [category]);

  // ---- loop items
  const loopItems = useMemo(() => {
    if (souvenirItems.length === 0) return [];
    return [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems];
  }, [souvenirItems]);

  // ---- step / loop width measure (NO hardcode cols)
  useEffect(() => {
    if (souvenirItems.length === 0) return;

    const measure = () => {
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;

      // force reflow
      track.offsetHeight;

      // loop width = 1/4 of duplicated track
      const fullWidth = track.scrollWidth;
      loopWidthRef.current = fullWidth / 4;

      // step = first card width + gap (real DOM)
      const firstCard = track.querySelector('[data-carousel-card]') as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(track).gap || '0');

      if (firstCard) {
        cardStepRef.current = firstCard.offsetWidth + gap;
      } else {
        // fallback: scroll by container width (rare)
        cardStepRef.current = container.clientWidth;
      }
    };

    measure();
    const t = setTimeout(measure, 100);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [souvenirItems.length]);

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

  const nextSlide = () => stepBy(cardStepRef.current || 0);
  const prevSlide = () => stepBy(-(cardStepRef.current || 0));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * 80;
    stepBy(delta);
  };

  // ---- auto scroll
  useEffect(() => {
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

  // ---- states
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
        {/* title */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {category === 'DONATION'
              ? 'จัดการของที่ระลึกสำหรับโครงการบริจาค'
              : `ของที่ระลึก${category ? ` (${CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] || category})` : ''}`}
          </h2>
        </div>

        {/* nav */}
        <button
          onClick={prevSlide}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-white transition hidden md:block"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={nextSlide}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-white transition hidden md:block"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        {/* carousel */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative overflow-hidden max-w-7xl mx-auto"
        >
          <div ref={trackRef} className="flex gap-12 will-change-transform pb-8">
            {loopItems.map((item, idx) => (
              <div
                data-carousel-card
                key={`${item.id}-${idx}`}
                onClick={() => onCardClick?.(item.id)}
                className="group shrink-0 basis-[90vw] md:basis-[calc(33.333%-32px)] cursor-pointer"
              >
                {/* ✅ กรอบรูป (แยกจากเนื้อหาเหมือน activity) */}
                <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm group-hover:shadow-2xl transition">
                  <div className="relative w-full aspect-4/3">
                    <Image
                      src={item.imageUrl || ''}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-[clamp(20px,4vw,48px)]"
                    />
                  </div>
                </div>

                {/* ✅ เนื้อหาอยู่นอกกรอบรูป + ความสูงเท่ากัน */}
                <div className="text-center w-full min-h-[120px] flex flex-col justify-between">
                  <div>
                    <h3 className="mt-4 text-lg md:text-xl font-bold text-orange-500 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      จำนวนคงเหลือ: {item.currentStock} {item.unit || 'ชิ้น'}
                    </p>
                  </div>

                  <div>
                    <p className="mt-1 text-xs text-gray-400">
                      หมวดหมู่: {CATEGORY_LABEL[(item.category ?? '') as keyof typeof CATEGORY_LABEL] || item.category || '-'}
                    </p>

                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          item.active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminSouvenirCarousel;
