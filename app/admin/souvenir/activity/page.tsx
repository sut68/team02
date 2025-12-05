"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Calendar, RefreshCw, Layers, CheckCircle } from "lucide-react";

// Mock Data
const souvenirItems = [
  {
    id: 1,
    name: 'เข็มกลัด "We are SUT"',
    activity: "ลงทะเบียนเข้าร่วมกิจกรรม ENGi Day",
    description: "เป็นของที่ระลึกสุดพิเศษ สำหรับผู้เข้าร่วมงานเท่านั้น",
    image: "/souvenir/EngiButton.png",
    remaining: 50,
  },
  {
    id: 2,
    name: "หมวก ENGi Cap",
    activity: "บริจาคเพื่อสนับสนุน ENGi",
    description: "รับหมวก ENGi Cap แทนคำขอบคุณ",
    image: "/souvenir/EngiCap.png",
    remaining: 35,
  },
  {
    id: 3,
    name: "ของที่ระลึกประจำปี",
    activity: "ของที่ระลึกประจำปี SUT",
    description: "สะท้อนความเรียบ เท่ และยั่งยืน สำหรับผู้สนับสนุนโครงการ",
    image: "/souvenir/EngiBrooch.png",
    remaining: 24,
  },
];

const activities = [
  {
    id: 1,
    name: "งานสานสัมพันธ์ศิษย์เก่า 2568",
    date: "15 ธ.ค. 2568",
    souvenir: "เข็มกลัด SUT",
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
    souvenir: "หมวก ENGi",
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
    souvenir: "ขวดน้ำ ENGi",
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
            รายการของที่ระลึกแต่ละกิจกรรม
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
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
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
          <h2 className="text-3xl font-medium text-gray-700 mb-8">
            กิจกรรม
          </h2>
          <div className="relative">
            {/* Arrow Left */}
            <button
              onClick={handlePrevActivity}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
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
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
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
              <h2 className="text-3xl font-medium text-gray-700 mb-8">
                {selectedActivity.name}
              </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: คงเหลือ */}
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
                  {selectedActivity.stats.remaining}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'remaining' ? 'text-orange-500' : 'text-gray-600'
                }`}>คงเหลือ</div>
              </div>
            </div>

            {/* Card 2: ลงทะเบียน */}
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
                  {selectedActivity.stats.registered}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'registered' ? 'text-orange-500' : 'text-gray-600'
                }`}>ลงทะเบียน</div>
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
                  {selectedActivity.stats.claimed}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'claimed' ? 'text-orange-500' : 'text-gray-600'
                }`}>รับของแล้ว</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Table without header */}
        <section className="mt-12">
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
                  {/* Mock Data - filtered by selected status */}
                  {[
                    { id: 1, name: "นาย สมชาย ใจดี", email: "somchai@example.com", date: "15 ธ.ค. 2567", status: "รับแล้ว", statusType: "claimed" },
                    { id: 2, name: "นางสาว สมหญิง รักดี", email: "somying@example.com", date: "15 ธ.ค. 2567", status: "รอรับ", statusType: "registered" },
                    { id: 3, name: "นาย ประยุทธ์ มั่นคง", email: "prayut@example.com", date: "15 ธ.ค. 2567", status: "รับแล้ว", statusType: "claimed" },
                    { id: 4, name: "นางสาว วิภา สุขใจ", email: "wipa@example.com", date: "15 ธ.ค. 2567", status: "รอรับ", statusType: "registered" },
                    { id: 5, name: "นาย อนุชา ดีงาม", email: "anucha@example.com", date: "15 ธ.ค. 2567", status: "รับแล้ว", statusType: "claimed" },
                    { id: 6, name: "นางสาว มาลี ใจงาม", email: "malee@example.com", date: "15 ธ.ค. 2567", status: "คงเหลือ", statusType: "remaining" },
                    { id: 7, name: "นาย สุรชัย วงศ์ดี", email: "surachai@example.com", date: "15 ธ.ค. 2567", status: "คงเหลือ", statusType: "remaining" },
                  ]
                  .filter(item => selectedStatus === 'all' || item.statusType === selectedStatus)
                  .map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-800">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{selectedActivity.souvenir}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "รับแล้ว" 
                            ? "bg-orange-100 text-orange-700" 
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
