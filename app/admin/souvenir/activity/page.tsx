"use client";
import React, { useState, useEffect } from "react";
import { CATEGORY_LABEL } from "@/constants/category";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Calendar, RefreshCw, Layers, CheckCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";

interface SouvenirItem {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  currentStock: number;
  unit?: string;
}

interface Activity {
  id: number;
  name: string;
  startDate: string;
  location: string | null;
  souvenirItem?: {
    id: number;
    name: string;
    imageUrl: string | null;
    sku: string;
  } | null;
}

interface EventRegistration {
  id: number;
  userId: number;
  registeredAt: string;
  attendanceStatus: string | null;
  user: {
    fullName: string;
    email: string;
  };
  entitlements?: Array<{
    item: {
      name: string;
    };
    redemptions: Array<{
      id: number;
      redeemedAt: string;
    }>;
  }>;
}

export default function SouvenirActivityPage() {
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'remaining' | 'registered' | 'claimed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Section 2 (Activity Carousel) ref
  const activityScrollRef = React.useRef<HTMLDivElement>(null);
  
  // Section 1 (Souvenir Carousel) refs
  const souvenirScrollRef = React.useRef<HTMLDivElement>(null);
  const souvenirTrackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(50);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch souvenir items
        const itemsRes = await fetch('/api/admin/souvenir/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData)) {
            setSouvenirItems(itemsData.filter((item: SouvenirItem) => item.category === 'ACTIVITY'));
          }
        }

        // Fetch events
        // Fetch activities from content (แทน events)
          const contentRes = await fetch('/api/content?category=ACTIVITY'); // หรือ EVENT
          if (contentRes.ok) {
            const data = await contentRes.json();
            const contents = data.contents ?? [];

            const mapped: Activity[] = contents.map((c: any) => ({
              id: c.id,
              name: c.TitleName || "(ไม่มีชื่อกิจกรรม)",
              startDate: c.createdAt || new Date().toISOString(),
              location: null,
              souvenirItem: null,
            }));

            setActivities(mapped);

            if (mapped.length > 0) setSelectedActivity(mapped[0]);
          }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch registrations when activity is selected
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!selectedActivity) return;
      
      try {
        const res = await fetch(`/api/content/${selectedActivity.id}/registrations`);
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data);
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      }
    };

    fetchRegistrations();

    // Set up polling to refresh registrations every 3 seconds
    const pollInterval = setInterval(fetchRegistrations, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedActivity]);

  const stepBy = (px: number) => {
    const loopW = loopWidthRef.current || 0;
    if (loopW <= 0) return;
    offsetRef.current += px;
    while (offsetRef.current >= loopW) offsetRef.current -= loopW;
    while (offsetRef.current < 0) offsetRef.current += loopW;
    if (souvenirTrackRef.current) {
      souvenirTrackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }
  };

  const handleNextActivity = () => {
    setCurrentActivityIndex((prev) => {
      const next = prev + 1;
      return next >= activities.length ? 0 : next;
    });
  };

  const handlePrevActivity = () => {
    setCurrentActivityIndex((prev) => {
      const previous = prev - 1;
      return previous < 0 ? activities.length - 1 : previous;
    });
  };

  const loopItems = React.useMemo(() => {
    const items = [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems];
    return items;
  }, [souvenirItems]);
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    
    const measure = () => {
      const track = souvenirTrackRef.current;
      const container = souvenirScrollRef.current;
      if (!track || !container) return;
      track.offsetHeight;
      // Measure actual card width + gap
      const firstCard = track.querySelector('[data-souvenir-card]');
      const gap = parseFloat(getComputedStyle(track).gap || '0');
      if (firstCard) {
        cardWidthRef.current = (firstCard as HTMLElement).offsetWidth + gap;
      }
      const fullWidth = track.scrollWidth;
      loopWidthRef.current = fullWidth / 4;
    };
    
    measure();
    const timer = setTimeout(measure, 100);
    
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [souvenirItems.length]);

  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    if (isPaused) return;
    
    let lastTime = performance.now();
    let rafId: number;

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      const loopW = loopWidthRef.current;
      if (loopW > 0 && souvenirTrackRef.current) {
        const distance = (speedRef.current * delta) / 1000;
        offsetRef.current += distance;
        while (offsetRef.current >= loopW) offsetRef.current -= loopW;
        while (offsetRef.current < 0) offsetRef.current += loopW;
        souvenirTrackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
      }
      
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, souvenirItems.length]);

  return (
    <main className="min-h-screen bg-white pt-10">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">กำลังโหลด...</div>
        </div>
      ) : (
        <>
      {/* Section 1: รายการของที่ระลึกแต่ละกิจกรรม */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            จัดการของที่ระลึกสำหรับกิจกรรม
          </h1>
        </div>
        {/* Carousel Container */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={() => { setIsPaused(true); stepBy(-cardWidthRef.current); }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={souvenirScrollRef}
              className="overflow-hidden py-4"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div
                ref={souvenirTrackRef}
                className="flex gap-6 will-change-transform"
                style={{ transform: 'translateX(0)', transition: 'none' }}
              >
                {loopItems.map((item, index) => (
                  <div
                    data-souvenir-card
                    key={`${item.id}-${index}`}
                    className="shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)]"
                  >
                    {/* ✅ Card เฉพาะรูป */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="relative h-72 md:h-80 bg-white">
                        <Image
                          src={item.imageUrl || "/souvenir/placeholder.png"}
                          alt={item.name}
                          fill
                          className="object-contain p-6"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </div>

                    {/* ✅ เนื้อหาอยู่นอกกรอบ (แต่ยังเลื่อนไปพร้อมกันเพราะอยู่ใน item wrapper เดียวกัน) */}
                    <div className="pt-6 text-center">
                      <h3 className="text-xl md:text-2xl font-bold text-orange-500 mb-2 line-clamp-1">
                        {item.name}
                      </h3>

                      <div className="text-gray-500 text-sm mb-2">
                        จำนวนคงเหลือ: <span className="font-semibold">{item.currentStock}</span>{" "}
                        {item.unit || "ชิ้น"}
                      </div>

                      <div className="text-gray-400 text-sm mb-4">
                        หมวดหมู่: {CATEGORY_LABEL[item.category as keyof typeof CATEGORY_LABEL] || "กิจกรรม"}
                      </div>

                      <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm bg-orange-100 text-orange-700 font-medium">
                        ใช้งาน
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => { setIsPaused(true); stepBy(cardWidthRef.current); }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Section 2: กิจกรรม (Activity Selector) */}
        <section className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            กิจกรรม
          </h2>
          <div className="relative">
            {/* Arrow Left */}
            <button
              onClick={() => {
                const el = activityScrollRef.current;
                if (!el) return;
                el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
              }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Previous activity"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Activity Cards Container - Carousel (manual scroll) */}
            <div
              ref={activityScrollRef}
              className="overflow-x-auto px-2 py-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex gap-6">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setCurrentActivityIndex(index);
                    }}
                    className={`shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)] bg-white rounded-xl transition-all duration-300 cursor-pointer ${
                      selectedActivity?.id === activity.id
                        ? "shadow-xl"
                        : "shadow-md hover:shadow-lg"
                    }`}
                  >
                    <div className="p-10 text-center min-h-[300px] flex flex-col items-center justify-center">
                      <h3 className="text-lg font-medium mb-3 text-orange-500">
                        {activity.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span className="text-base">
                          {new Date(activity.startDate).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow Right */}
            <button
              onClick={() => {
                const el = activityScrollRef.current;
                if (!el) return;
                el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
              }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Next activity"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </section>

        {/* Section 3 & 4: Only show when activity is selected */}
        {selectedActivity && (
          <>
            {/* Section 3: สถิติของกิจกรรมที่เลือก */}
            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                {selectedActivity.name}
              </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: ลงทะเบียน */}
            <div 
              onClick={() => setSelectedStatus('registered')}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer min-h-[200px] flex items-center ${
                selectedStatus === 'registered' 
                  ? 'border-orange-300 shadow-xl' 
                  : 'border-orange-100 hover:shadow-lg'
              }`}
            >
              <div className="p-10 text-center w-full">
                <div className="flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-orange-500" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${
                  selectedStatus === 'registered' ? 'text-orange-500' : 'text-gray-800'
                }`}>
                  {registrations.length}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'registered' ? 'text-orange-500' : 'text-gray-600'
                }`}>ลงทะเบียน</div>
              </div>
            </div>

            {/* Card 2: คงเหลือ */}
            <div 
              onClick={() => setSelectedStatus('remaining')}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer min-h-[200px] flex items-center ${
                selectedStatus === 'remaining' 
                  ? 'border-orange-300 shadow-xl' 
                  : 'border-orange-100 hover:shadow-lg'
              }`}
            >
              <div className="p-10 text-center w-full">
                <div className="flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-orange-500" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${
                  selectedStatus === 'remaining' ? 'text-orange-500' : 'text-gray-800'
                }`}>
                  {registrations.filter(r => {
                    // ยังไม่ได้รับของ = ไม่มี redemptions
                    return !r.entitlements?.some(e => e.redemptions.length > 0);
                  }).length}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'remaining' ? 'text-orange-500' : 'text-gray-600'
                }`}>คงเหลือ</div>
              </div>
            </div>

            {/* Card 3: รับของแล้ว */}
            <div 
              onClick={() => setSelectedStatus('claimed')}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer min-h-[200px] flex items-center ${
                selectedStatus === 'claimed' 
                  ? 'border-orange-300 shadow-xl' 
                  : 'border-orange-100 hover:shadow-lg'
              }`}
            >
              <div className="p-10 text-center w-full">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-orange-500" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${
                  selectedStatus === 'claimed' ? 'text-orange-500' : 'text-gray-800'
                }`}>
                  {registrations.filter(r => {
                    // รับของแล้ว = มี redemptions
                    return r.entitlements?.some(e => e.redemptions.length > 0);
                  }).length}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'claimed' ? 'text-orange-500' : 'text-gray-600'
                }`}>รับของแล้ว</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Search & Table */}
        <section className="mt-12">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ หรืออีเมล"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                  size="md"
                  radius="md"
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ลำดับ</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ชื่อ-สกุล</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">อีเมล</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">วันที่ลงทะเบียน</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ของที่ระลึก</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations
                    .filter(reg => {
                      if (selectedStatus === 'all') return true;
                      const hasRedemption = reg.entitlements?.some(e => e.redemptions.length > 0);
                      if (selectedStatus === 'claimed') return hasRedemption;
                      if (selectedStatus === 'remaining') return !hasRedemption;
                      if (selectedStatus === 'registered') return true;
                      return true;
                    })
                    .filter(reg => {
                      const term = searchTerm.toLowerCase().trim();
                      if (!term) return true;
                      const fullName = reg.user.fullName?.toLowerCase() || '';
                      const email = reg.user.email?.toLowerCase() || '';
                      return fullName.includes(term) || email.includes(term);
                    })
                    .map((reg, index) => {
                      const registeredDate = new Date(reg.registeredAt);
                      const thaiDate = registeredDate.toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      
                      const hasRedemption = reg.entitlements?.some(e => e.redemptions.length > 0);
                      const souvenirName = reg.entitlements?.[0]?.item.name || selectedActivity.souvenirItem?.name || 'ของที่ระลึกกิจกรรม';
                      
                      let statusText = 'รอรับ';
                      let statusColor = 'bg-gray-100 text-gray-700';
                      
                      if (hasRedemption) {
                        statusText = 'รับแล้ว';
                        statusColor = 'bg-orange-100 text-orange-700';
                      }
                      
                      return (
                        <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-800">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">{reg.user.fullName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{reg.user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{thaiDate}</td>
                          <td className="px-6 py-4 text-sm text-orange-600">{souvenirName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
        </>
      )}
    </main>
  );
}

