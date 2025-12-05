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
    stats: {
      remaining: 15,
      registered: 60,
      claimed: 45,
    },
  },
];

export default function SouvenirActivityPage() {
  const [selectedActivity, setSelectedActivity] = useState(activities[0]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
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
      {/* Section 1: รายการของที่ระลึกแต่ละกิจกรรม - Full Width */}
      <section className="mb-12 py-8">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            รายการของที่ระลึกแต่ละกิจกรรม
          </h1>
        </div>
        
        {/* Carousel Container - Full Width */}
        <div className="relative px-4 md:px-12">
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
                  <div className="relative h-72 md:h-80 bg-gray-100">
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
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Section 2: กิจกรรม (Activity Selector) */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            กิจกรรม
          </h2>
          <div className="relative">
            {/* Arrow Left */}
            <button
              onClick={handlePrevActivity}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
              aria-label="Previous activity"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Activity Cards */}
            <div className="overflow-hidden px-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setCurrentActivityIndex(index);
                    }}
                    className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 ${
                      selectedActivity.id === activity.id
                        ? "ring-4 ring-orange-500 shadow-xl"
                        : "hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                      <h3
                        className={`text-lg font-bold ${
                          selectedActivity.id === activity.id
                            ? "text-orange-500"
                            : "text-gray-800"
                        }`}
                      >
                        {activity.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{activity.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow Right */}
            <button
              onClick={handleNextActivity}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
              aria-label="Next activity"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </section>

        {/* Section 3: สถิติของกิจกรรมที่เลือก */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            {selectedActivity.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: คงเหลือ */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <RefreshCw className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-5xl font-bold text-gray-800 mb-2">
                {selectedActivity.stats.remaining}
              </div>
              <div className="text-gray-600 font-medium">คงเหลือ</div>
            </div>

            {/* Card 2: ลงทะเบียน */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Layers className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-5xl font-bold text-gray-800 mb-2">
                {selectedActivity.stats.registered}
              </div>
              <div className="text-gray-600 font-medium">ลงทะเบียน</div>
            </div>

            {/* Card 3: รับของแล้ว */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-5xl font-bold text-gray-800 mb-2">
                {selectedActivity.stats.claimed}
              </div>
              <div className="text-gray-600 font-medium">รับของแล้ว</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
