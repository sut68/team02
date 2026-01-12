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
  actionHref: string; // บังคับว่าต้องมีค่านี้
  requireAuth?: boolean;
}

export function SouvenirSection() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setIsAuthenticated(!!data?.user))
      .catch(() => setIsAuthenticated(false));
  }, []);
  
  const [souvenirItems, setSouvenirItems] = React.useState<SouvenirItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // --- Fetch Data ---
  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/souvenir/items');
        const items = await res.json();
        
        if (!Array.isArray(items)) {
          setSouvenirItems([]);
          setLoading(false);
          return;
        }

        const normalizeCategory = (c?: string) => {
          if (c === "กิจกรรม") return "ACTIVITY";
          if (c === "บริจาค") return "DONATION";
          return c;
        };

        // ✅ กำหนด Logic ลิงก์ตรงนี้ที่เดียว
        const categoryMeta: Record<string, { label: string; href: (item: any) => string; getDescription?: (name: string) => string }> = {
          ACTIVITY: {
            label: 'ลงทะเบียนเข้าร่วมกิจกรรม',
            href: (item: any) => {
              // 1. ถ้าผูกกับ Content (ข่าวกิจกรรม)
              if (Array.isArray(item.contents) && item.contents.length > 0) {
                return `/user/news/${item.contents[0].id}`; // ลิงก์ไปหน้าข่าวกิจกรรม
              }
              // 2. ถ้าไม่มี ให้ไปหน้าข่าวรวม
              return '/user/news';
            },
            getDescription: (name) => `รับ '${name}' เมื่อลงทะเบียนกิจกรรม`,
          },
          DONATION: {
            label: 'บริจาคเพื่อสนับสนุน ENGi',
            href: (item: any) => {
              // 1. ถ้าผูกกับ Project บริจาค
              if (Array.isArray(item.donationProjects) && item.donationProjects.length > 0) {
                return `/user/donation/${item.donationProjects[0].id}`; // ✅ ลิงก์ไปหน้ารายละเอียดโครงการ
              }
              // 2. ถ้าไม่มี ให้ไปหน้าบริจาครวม
              return '/user/donation'; 
            },
            getDescription: (name) => `รับ ${name} แทนคำขอบคุณ`,
          },
        };

        const sortedItems = items
          .map((it: any) => ({ ...it, category: normalizeCategory(it.category) }))
          .map((item: any) => {
            const meta = categoryMeta[item.category] || { 
              label: 'ดูรายละเอียด', 
              href: () => '#', 
              getDescription: (n: string) => item.description || n 
            };
            
            // ✅ คำนวณ Link ทันทีและเก็บใส่ actionHref
            const generatedHref = meta.href(item);

            return {
              ...item,
              actionLabel: meta.label,
              actionHref: generatedHref,
              description: meta.getDescription ? meta.getDescription(item.name) : item.description,
            };
          });

        setSouvenirItems(sortedItems);
      } catch (error) {
        console.error('Failed to fetch souvenir items:', error);
        setSouvenirItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- Carousel Logic ---
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

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * 60;
      stepBy(delta);
    };
    el.addEventListener("wheel", wheelHandler, { passive: false });
    return () => el.removeEventListener("wheel", wheelHandler as any);
  }, []);

  const loopItems = React.useMemo(() => {
    if (souvenirItems.length === 0) return [];
    return [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems];
  }, [souvenirItems]);

  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    const measure = () => {
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;
      track.offsetHeight;
      loopWidthRef.current = track.scrollWidth / 4;
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

  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!isPaused) stepBy(speedRef.current * dt);
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
        <div className="text-center text-gray-500">ยังไม่มีของที่ระลึกในขณะนี้</div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white px-4 py-16 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-88px)] flex items-center">
      <div className="container mx-auto relative">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">ของที่ระลึก</h2>
        </div>

        <button onClick={prevSlide} className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 bg-gray-50/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors hidden md:block">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button onClick={nextSlide} className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 bg-gray-50/90 backdrop-blur rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors hidden md:block">
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        <div ref={scrollContainerRef} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} className="relative overflow-hidden max-w-7xl mx-auto">
          <div ref={trackRef} className="flex gap-12 will-change-transform">
            {loopItems.map((item, idx) => (
              // ✅ ใช้ item.actionHref ที่คำนวณไว้แล้วโดยตรง ไม่ต้องมี function getDestinationUrl มาขวาง
              <Link 
                key={`${item.id}-${idx}`} 
                href={item.actionHref} 
                className="group block basis-full md:basis-1/3 shrink-0"
              >
                <div className="flex flex-col items-center text-center">
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
                  <h3 className="mt-6 text-xl md:text-2xl font-medium text-orange-600">
                    {item.actionLabel}
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