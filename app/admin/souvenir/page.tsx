"use client";
import React, { useState, useRef, useEffect } from "react";
import { Activity, HandHeart } from "lucide-react";
import { AdminSouvenirCarousel } from "./AdminSouvenirCarousel";
import { SouvenirDetailForm } from "./SouvenirDetailForm";

export default function SouvenirMenuPage() {
  const [showCarousel, setShowCarousel] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (itemId: number) => {
    setShowDetail(true);
  };

  useEffect(() => {
    if (showDetail && detailRef.current) {
      setTimeout(() => {
        const yOffset = -120;
        const element = detailRef.current;
        if (element) {
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [showDetail]);

  return (
    <main className="min-h-screen bg-white">
      {/* Header + Cards Section */}
      <div className="px-4 py-12">
        <div className="max-w-5xl w-full mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-14 text-center tracking-tight">
            รายการของที่ระลึก
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Card 1: กิจกรรม */}
            <div
              className="group rounded-3xl bg-white shadow-lg border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-200 flex flex-col items-center py-16 px-8 cursor-pointer outline-none focus:ring-2 focus:ring-orange-400"
              tabIndex={0}
              role="button"
              onClick={() => setShowCarousel(showCarousel === "activity" ? null : "activity")}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowCarousel(showCarousel === "activity" ? null : "activity"); }}
              aria-pressed={showCarousel === "activity"}
            >
              <div className="flex flex-col items-center mb-4">
                <Activity className="w-28 h-28 text-orange-500 group-hover:drop-shadow-lg mb-2" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 mb-1">activity icon</span>
              </div>
              <div className="text-xl font-semibold text-gray-700">กิจกรรม</div>
            </div>
            {/* Card 2: บริจาค */}
            <div
              className="group rounded-3xl bg-white shadow-lg border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-200 flex flex-col items-center py-16 px-8 cursor-pointer outline-none focus:ring-2 focus:ring-orange-400"
              tabIndex={0}
              role="button"
              onClick={() => setShowCarousel(showCarousel === "donation" ? null : "donation")}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowCarousel(showCarousel === "donation" ? null : "donation"); }}
              aria-pressed={showCarousel === "donation"}
            >
              <div className="flex flex-col items-center mb-4">
                <HandHeart className="w-28 h-28 text-orange-400 group-hover:text-orange-500 group-hover:drop-shadow-lg mb-2" strokeWidth={1.5} />
                <span className="text-xs text-gray-400 mb-1">hand-heart icon</span>
              </div>
              <div className="text-xl font-semibold text-gray-700">บริจาค</div>
            </div>
          </div>
        </div>
      </div>
      {/* Carousel Section - Full Width like user page */}
      <div className={`transition-all duration-300 ${showCarousel ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
        {showCarousel === "activity" && <AdminSouvenirCarousel onCardClick={handleCardClick} />}
        {showCarousel === "donation" && <AdminSouvenirCarousel onCardClick={handleCardClick} />}
      </div>
      {/* Detail Form Section */}
      <div ref={detailRef} className={`transition-all duration-300 ${showDetail ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
        {showDetail && <SouvenirDetailForm />}
      </div>
    </main>
  );
}
