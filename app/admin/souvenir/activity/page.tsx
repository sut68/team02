"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, RefreshCw, Layers, CheckCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/Card";

const CATEGORY_LABEL = {
  ACTIVITY: "กิจกรรม",
  SEMINAR: "สัมมนา",
  OTHER: "อื่นๆ"
};

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
    qtyUsed: number;
    qtyGranted: number;
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
  
  const activityScrollRef = React.useRef<HTMLDivElement>(null);
  const souvenirScrollRef = React.useRef<HTMLDivElement>(null);
  const souvenirTrackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(50);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemsRes = await fetch('/api/admin/souvenir/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData)) {
            setSouvenirItems(itemsData.filter((item: SouvenirItem) => item.category === 'ACTIVITY'));
          }
        }

        const contentRes = await fetch('/api/content?category=ACTIVITY'); 
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

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!selectedActivity) {
        setRegistrations([]);
        return;
      }
      try {
        const res = await fetch(`/api/content/${selectedActivity.id}/registrations`);
        if (res.ok) {
          const data = await res.json();
          const normalized = Array.isArray(data) ? data.map((reg: any) => {
            const rawEntitlements = reg?.entitlements || reg?.redemptions || [];
            return {
              ...reg,
              entitlements: Array.isArray(rawEntitlements) ? rawEntitlements : [],
              user: reg?.user || { fullName: 'Unknown', email: '-' }
            };
          }) : [];
          // 🔍 Debug: Log first registration to verify entitlements structure
          if (normalized.length > 0) {
            console.log('✅ First registration entitlements:', normalized[0].entitlements);
          }
          setRegistrations(normalized);
        } else {
          setRegistrations([]);
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
        setRegistrations([]);
      }
    };
    fetchRegistrations();
    const pollInterval = setInterval(fetchRegistrations, 1000);
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

  const hasClaimed = (reg: any): boolean => {
    if (!reg) return false;
    
    let entitlements: any[] = [];
    
    if (Array.isArray(reg.entitlements)) {
      entitlements = reg.entitlements;
    } else if (Array.isArray(reg.redemptions)) {
      entitlements = reg.redemptions;
    }
    
    if (entitlements.length === 0) {
      return false;
    }
    
    const claimed = entitlements.some((e: any) => {
      if (!e || typeof e !== 'object') return false;
      if (typeof e.qtyUsed !== 'number') return false;
      if (typeof e.qtyGranted !== 'number') return false;
      return e.qtyUsed >= e.qtyGranted;
    });
    
    // 🔍 Debug: Log hasClaimed result
    console.log(`hasClaimed for user ${reg.userId}:`, claimed, 'entitlements:', entitlements);
    
    return claimed;
  };

  const safeRegistrations = Array.isArray(registrations) ? registrations : [];

  return (
    <main className="min-h-screen bg-white pt-10">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">กำลังโหลด...</div>
        </div>
      ) : (
        <>
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                จัดการของที่ระลึกสำหรับกิจกรรม
              </h1>
            </div>
            <div className="max-w-7xl mx-auto px-4">
              <div className="relative">
                <button
                  onClick={() => { setIsPaused(true); stepBy(-cardWidthRef.current); }}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

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
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                          <div className="relative h-72 md:h-80 bg-white">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain p-6"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <div className="text-center text-gray-400">
                                  <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <span className="text-xs">ไม่มีรูปภาพ</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

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

                <button
                  onClick={() => { setIsPaused(true); stepBy(cardWidthRef.current); }}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                กิจกรรม
              </h2>
              <div className="relative">
                <button
                  onClick={() => {
                    const el = activityScrollRef.current;
                    if (!el) return;
                    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                  }}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                <div
                  ref={activityScrollRef}
                  className="overflow-x-auto px-2 py-4"
                  style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

                <button
                  onClick={() => {
                    const el = activityScrollRef.current;
                    if (!el) return;
                    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                  }}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </section>

            {selectedActivity && (
              <>
                <section>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                    {selectedActivity.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                      className={`cursor-pointer border-2 transition ${
                        selectedStatus === 'registered' ? 'border-orange-300' : 'border-orange-100'
                      }`}
                      onClick={() => setSelectedStatus('registered')}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                          <Layers className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-normal text-gray-700">ลงทะเบียน</h3>
                        <p className="text-2xl font-medium text-gray-800 mt-2">
                          {safeRegistrations.length}
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer border-2 transition ${
                        selectedStatus === 'remaining' ? 'border-orange-300' : 'border-orange-100'
                      }`}
                      onClick={() => setSelectedStatus('remaining')}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                          <RefreshCw className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-normal text-gray-700">คงเหลือ</h3>
                        <p className="text-2xl font-medium text-gray-800 mt-2">
                          {safeRegistrations.filter(r => !hasClaimed(r)).length}
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer border-2 transition ${
                        selectedStatus === 'claimed' ? 'border-orange-300' : 'border-orange-100'
                      }`}
                      onClick={() => setSelectedStatus('claimed')}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                          <CheckCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-normal text-gray-700">รับของแล้ว</h3>
                        <p className="text-2xl font-medium text-gray-800 mt-2">
                          {safeRegistrations.filter(r => hasClaimed(r)).length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <section className="mt-12">
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อ หรืออีเมล"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

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
                          {safeRegistrations
                            .filter(reg => {
                              if (selectedStatus === 'all') return true;
                              if (selectedStatus === 'claimed') return hasClaimed(reg);
                              if (selectedStatus === 'remaining') return !hasClaimed(reg);
                              if (selectedStatus === 'registered') return true;
                              return true;
                            })
                            .filter(reg => {
                              const term = searchTerm.toLowerCase().trim();
                              if (!term) return true;
                              const fullName = reg.user?.fullName?.toLowerCase() || '';
                              const email = reg.user?.email?.toLowerCase() || '';
                              return fullName.includes(term) || email.includes(term);
                            })
                            .map((reg, index) => {
                              const registeredDate = new Date(reg.registeredAt);
                              const thaiDate = registeredDate.toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              });
                              
                              const claimed = hasClaimed(reg);
                              const souvenirName = reg.entitlements?.[0]?.item?.name || selectedActivity.souvenirItem?.name || 'ของที่ระลึกกิจกรรม';
                              let statusText = 'รอรับ';
                              let statusColor = 'bg-gray-100 text-gray-700';
                              if (claimed) {
                                statusText = 'รับแล้ว';
                                statusColor = 'bg-orange-100 text-orange-700';
                              }
                              return (
                                <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 text-sm text-gray-800">{index + 1}</td>
                                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{reg.user?.fullName || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{reg.user?.email || '-'}</td>
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