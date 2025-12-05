"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Calendar, RefreshCw, Layers, CheckCircle } from "lucide-react";

// Mock Data
const souvenirItems = [
  {
    id: 1,
    name: "ถุงผ้า SUT",
    activity: "ENGi Development Fund",
    description: "ของสมนาคุณสำหรับผู้ร่วมบริจาคในโครงการ ENGi Development Fund",
    image: "/souvenir/Bag.png",
    remaining: 50,
  },
  {
    id: 2,
    name: "Suranaree Notebook",
    activity: "Homecoming Day 2024",
    description: "สมุดโน้ตสีน้ำตาลแบบ premium สำหรับผู้บริจาคในกิจกรรม Homecoming Day 2024",
    image: "/souvenir/Book.png",
    remaining: 35,
  },
  {
    id: 3,
    name: "SUT Umbrella",
    activity: "Engineering Open House",
    description: "ร่มสีดำโลโก้ SUT ใช้สำหรับผู้บริจาคโครงการ Engineering Open House",
    image: "/souvenir/Umbrella.png",
    remaining: 24,
  },
];

const activities = [
  {
    id: 1,
    name: "ENGi Development Fund",
    date: "15 ธ.ค. 2568",
    souvenir: "ถุงผ้า SUT",
    stats: {
      remaining: 20,
      registered: 100,
      claimed: 80,
    },
  },
  {
    id: 2,
    name: "Homecoming Day 2024",
    date: "20 ม.ค. 2568",
    souvenir: "Suranaree Notebook",
    stats: {
      remaining: 35,
      registered: 85,
      claimed: 50,
    },
  },
  {
    id: 3,
    name: "Engineering Open House",
    date: "10 ก.พ. 2568",
    souvenir: "SUT Umbrella",
    stats: {
      remaining: 15,
      registered: 60,
      claimed: 45,
    },
  },
];

export default function SouvenirActivityPage() {
  const [selectedActivity, setSelectedActivity] = useState<typeof activities[0] | null>(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'remaining' | 'registered' | 'claimed'>('all');
  const [donationStatuses, setDonationStatuses] = useState<{[key: number]: string}>({
    1: "จัดส่งแล้ว",
    2: "กำลังดำเนินการ",
    3: "จัดส่งแล้ว",
    4: "กำลังดำเนินการ",
    5: "จัดส่งแล้ว",
  });

  const handleStatusChange = (id: number, newStatus: string) => {
    setDonationStatuses(prev => ({
      ...prev,
      [id]: newStatus
    }));
  };
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(50); // px per second - increased for smoother continuous scroll

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

  const handleNextActivity = () => {
    stepBy(cardWidthRef.current || 0);
  };

  const handlePrevActivity = () => {
    stepBy(-(cardWidthRef.current || 0));
  };

  const loopItems = React.useMemo(() => {
    // Create more duplicates for truly seamless infinite loop
    const items = [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems];
    return items;
  }, []);

  // Measure widths for seamless loop
  React.useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;
      const fullWidth = track.scrollWidth;
      loopWidthRef.current = fullWidth / 4; // Divided by 4 since we have 4x duplicates
      const cols = window.innerWidth >= 768 ? 3 : 1;
      cardWidthRef.current = container.clientWidth / cols;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Auto-scroll animation
  React.useEffect(() => {
    if (isPaused) return;
    let lastTime = performance.now();
    let rafId: number;

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      const distance = (speedRef.current * delta) / 1000;
      stepBy(distance);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused]);

  return (
    <main className="min-h-screen bg-white pt-10">
      {/* Section 1: รายการของที่ระลึกแต่ละกิจกรรม */}
      <section className=" py-8">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h1 className="text-3xl font-medium text-gray-700 mb-8">
            รายการของที่ระลึกแต่ละการบริจาค
          </h1>
        </div>
        
        {/* Carousel Container */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={handlePrevActivity}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="overflow-hidden py-4"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
            <div
              ref={trackRef}
              className="flex gap-6 will-change-transform"
              style={{ transform: 'translateX(0)', transition: 'none' }}
            >
              {loopItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex-shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)] bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative h-72 md:h-80 bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-6"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {item.name}
                    </h3>
                    <p className="text-orange-500 font-semibold mb-3 text-sm">
                      {item.activity}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <span className="text-gray-500 text-sm">คงเหลือ:</span>
                      <span className="text-lg font-bold text-gray-800">{item.remaining}</span>
                      <span className="text-gray-500 text-sm">ชิ้น</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

            {/* Right Arrow */}
            <button
              onClick={handleNextActivity}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
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
          <h2 className="text-3xl font-medium text-gray-700 mb-8">
            กิจกรรม
          </h2>
          <div className="relative">
            {/* Arrow Left */}
            <button
              onClick={handlePrevActivity}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
              aria-label="Previous activity"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Activity Cards */}
            <div className="overflow-visible px-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setCurrentActivityIndex(index);
                    }}
                    className={`bg-white rounded-xl transition-all duration-300 cursor-pointer min-h-[300px] flex items-center ${
                      selectedActivity?.id === activity.id
                        ? "shadow-xl"
                        : "shadow-md hover:shadow-lg"
                    }`}
                  >
                    <div className="p-10 text-center w-full">
                      <h3 className="text-lg font-medium mb-3 text-orange-500">
                        {activity.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <MapPin className="w-5 h-5" />
                        <span className="text-base">{activity.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow Right */}
            <button
              onClick={handleNextActivity}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
              aria-label="Next activity"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </section>

        {/* Section 3 & 4: Only show when activity is selected */}
        {selectedActivity && (
          <>
            {/* Section 3: ตาราง */}
            <section>
              <h2 className="text-3xl font-medium text-gray-700 mb-8">
                {selectedActivity.name}
              </h2>
          
        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ลำดับที่</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">วันที่</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ผู้บริจาค</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ที่อยู่</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ของที่ระลึก</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">เลขแทรค</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">สถานะการจัดส่ง</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mock Data */}
                  {[
                    { id: 1, date: "15 ธ.ค. 2567", name: "นาย สมชาย ใจดี", address: "123 ถ.มิตรภาพ ต.สุรนารี อ.เมือง จ.นครราชสีมา 30000", tracking: "TH1234567890" },
                    { id: 2, date: "16 ธ.ค. 2567", name: "นางสาว สมหญิง รักดี", address: "456 ถ.ราชดำเนิน ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000", tracking: "TH0987654321" },
                    { id: 3, date: "17 ธ.ค. 2567", name: "นาย ประยุทธ์ มั่นคง", address: "789 ถ.โคราช ต.โพธิ์กลาง อ.เมือง จ.นครราชสีมา 30000", tracking: "TH1122334455" },
                    { id: 4, date: "18 ธ.ค. 2567", name: "นางสาว วิภา สุขใจ", address: "321 ถ.ชุมพล ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000", tracking: "TH5566778899" },
                    { id: 5, date: "19 ธ.ค. 2567", name: "นาย อนุชา ดีงาม", address: "654 ถ.มหาดไทย ต.หนองไผ่ อ.เมือง จ.นครราชสีมา 30000", tracking: "TH9988776655" },
                  ]
                  .sort((a, b) => {
                    const statusA = donationStatuses[a.id] || "กำลังดำเนินการ";
                    const statusB = donationStatuses[b.id] || "กำลังดำเนินการ";
                    // กำลังดำเนินการ (0) อยู่ด้านบน, จัดส่งแล้ว (1) อยู่ด้านล่าง
                    if (statusA === "กำลังดำเนินการ" && statusB === "จัดส่งแล้ว") return -1;
                    if (statusA === "จัดส่งแล้ว" && statusB === "กำลังดำเนินการ") return 1;
                    return 0;
                  })
                  .map((item, index) => {
                    const currentStatus = donationStatuses[item.id] || "กำลังดำเนินการ";
                    return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-800">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{item.address}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{selectedActivity.souvenir}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-mono">{item.tracking}</td>
                      <td className="px-6 py-4 pr-8">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          style={{ backgroundPosition: 'right rem center' }}
                          className={`px-4 py-1 pr-8 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-orange-500 ${
                            currentStatus === "จัดส่งแล้ว" 
                              ? "bg-orange-100 text-orange-700" 
                              : "bg-gray-100 text-gray-700"
                          }`}>
                          <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                          <option value="จัดส่งแล้ว">จัดส่งแล้ว</option>
                        </select>
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
    </main>
  );
}
