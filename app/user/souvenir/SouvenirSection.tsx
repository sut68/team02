'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SouvenirItem {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  linkedEventId: number | null;
  linkedEventName: string | null;
  linkedEventHref: string;
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

  // ดึงข้อมูลจาก API
  React.useEffect(() => {
    async function fetchData() {
      try {
        // ดึงข้อมูล events ที่มีการเชื่อมกับของที่ระลึก
        const eventsRes = await fetch('/api/admin/events');
        const events = await eventsRes.json();

        // ตรวจสอบว่า events เป็น array หรือไม่
        if (!Array.isArray(events)) {
          console.error('Events is not an array:', events);
          setLoading(false);
          return;
        }

        // กรองเฉพาะ events ที่มี souvenirItem และสร้าง map
        const itemsMap = new Map<number, any>();
        
        events.forEach((event: any) => {
          if (event.souvenirItem && event.souvenirItem.category) {
            const item = event.souvenirItem;
            // ใช้ item ที่มี category ชัดเจน
            if (!itemsMap.has(item.id)) {
              itemsMap.set(item.id, {
                id: item.id,
                name: item.name,
                description: item.description,
                imageUrl: item.imageUrl,
                category: item.category,
                linkedEventId: event.id,
                linkedEventName: event.name,
                linkedEventHref: '#',
              });
            }
          }
        });

        // แปลง map เป็น array และเรียงตาม category (กิจกรรม -> บริจาค)
        const categoryOrder = { 'กิจกรรม': 1, 'บริจาค': 2 };
        const sortedItems = Array.from(itemsMap.values())
          .filter(item => ['กิจกรรม', 'บริจาค'].includes(item.category))
          .sort((a, b) => {
            const orderA = categoryOrder[a.category as keyof typeof categoryOrder] || 999;
            const orderB = categoryOrder[b.category as keyof typeof categoryOrder] || 999;
            return orderA - orderB;
          })
          .map(item => {
            // กำหนด title และ href ตาม category
            let linkedEventName = item.linkedEventName;
            let linkedEventHref = '#';
            let description = item.description;

            if (item.category === 'กิจกรรม') {
              linkedEventName = `ลงทะเบียนเข้าร่วมกิจกรรม ${item.linkedEventName}`;
              linkedEventHref = `/user/booking`;
              if (!description) {
                description = `รับ '${item.name}' เป็นของที่ระลึกสุดพิเศษ`;
              }
            } else if (item.category === 'บริจาค') {
              linkedEventName = `บริจาคเพื่อสนับสนุน ENGi`;
              linkedEventHref = `/user/donation`;
              if (!description) {
                description = `รับ ${item.name} แทนคำขอบคุณ`;
              }
            }

            return {
              ...item,
              linkedEventName,
              linkedEventHref,
              description,
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

  const loopItems = React.useMemo(() => [...souvenirItems, ...souvenirItems], [souvenirItems]);

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
            {loading ? (
              <div className="w-full text-center py-8 text-gray-500">กำลังโหลด...</div>
            ) : souvenirItems.length === 0 ? (
              <div className="w-full text-center py-8 text-gray-500">ยังไม่มีของที่ระลึกในขณะนี้</div>
            ) : (
              loopItems.map((item, idx) => (
                <Link 
                  key={`${item.id}-${idx}`} 
                  href={!isAuthenticated ? '/auth/login' : item.linkedEventHref} 
                  className="group block basis-full md:basis-1/3 shrink-0"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* รูปหลัก */}
                    <div className="relative w-full h-96 md:h-[420px] bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gray-200">
                      <Image
                        src={item.imageUrl || '/souvenir/placeholder.png'}
                        alt={item.name}
                        fill
                        priority={idx % souvenirItems.length === 1}
                        className={'object-contain p-6'}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>

                    {/* ข้อความโปรโมต */}
                    <h3 className="mt-6 text-xl md:text-2xl font-medium text-orange-600">
                      {item.linkedEventName}
                    </h3>
                    <p className="mt-2 text-sm md:text-base text-gray-500 max-w-md">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SouvenirSection;
