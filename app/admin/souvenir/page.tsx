"use client";
import React, { useState, useRef, useEffect } from "react";
import { Activity, HandHeart, Plus } from "lucide-react";
import { AdminSouvenirCarousel } from "./AdminSouvenirCarousel";
import { SouvenirDetailForm } from "./SouvenirDetailForm";

export default function SouvenirMenuPage() {
  const [showCarousel, setShowCarousel] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (itemId: number) => {
    setSelectedItemId(itemId);
    setIsCreating(false);
    setShowDetail(true);
  };

  const handleCreateNew = () => {
    setSelectedItemId(null);
    setIsCreating(true);
    setShowDetail(true);
    setShowCarousel(null);
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
      <div className="px-4 py-12 mt-8">
        <div className="container mx-auto">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between mb-14">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              จัดการของที่ระลึก
            </h1>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="w-5 h-5" />
              เพิ่มของที่ระลึก
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Card 1: กิจกรรม */}
            <div
              className="group rounded-3xl bg-white shadow-lg border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-200 flex flex-col items-center py-16 px-8 cursor-pointer outline-none focus:ring-2 focus:ring-orange-400"
              tabIndex={0}
              role="button"
              onClick={() => setShowCarousel(showCarousel === "ACTIVITY" ? null : "ACTIVITY")}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowCarousel(showCarousel === "ACTIVITY" ? null : "ACTIVITY"); }}
              aria-pressed={showCarousel === "ACTIVITY"}
            >
              <div className="flex flex-col items-center mb-4">
                <Activity className="w-28 h-28 text-orange-500 group-hover:drop-shadow-lg mb-2" strokeWidth={1.5} />
              </div>
              <div className="text-xl font-semibold text-gray-700">กิจกรรม</div>
            </div>
            {/* Card 2: บริจาค */}
            <div
              className="group rounded-3xl bg-white shadow-lg border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-200 flex flex-col items-center py-16 px-8 cursor-pointer outline-none focus:ring-2 focus:ring-orange-400"
              tabIndex={0}
              role="button"
              onClick={() => setShowCarousel(showCarousel === "DONATION" ? null : "DONATION")}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowCarousel(showCarousel === "DONATION" ? null : "DONATION"); }}
              aria-pressed={showCarousel === "DONATION"}
            >
              <div className="flex flex-col items-center mb-4">
                <HandHeart className="w-28 h-28 text-orange-400 group-hover:text-orange-500 group-hover:drop-shadow-lg mb-2" strokeWidth={1.5} />
              </div>
              <div className="text-xl font-semibold text-gray-700">บริจาค</div>
            </div>
          </div>
        </div>
      </div>
      {/* Carousel Section - Full Width like user page */}
      <div className={`transition-all duration-300 ${showCarousel ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
        {showCarousel && (
          <AdminSouvenirCarousel
            category={showCarousel}
            onCardClick={handleCardClick}
          />
        )}
      </div>
      {/* Detail Form Section */}
      <div ref={detailRef} className={`transition-all duration-300 ${showDetail ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
        {showDetail && (
          isCreating ? (
            <SouvenirDetailForm isCreating={true} onSuccess={() => {
              setShowDetail(false);
              setIsCreating(false);
              // Refresh carousel if visible
              if (showCarousel) {
                window.location.reload();
              }
            }} />
          ) : selectedItemId ? (
            <SouvenirDetailForm 
              itemId={selectedItemId} 
              isCreating={false}
              onSuccess={() => {
                setShowDetail(false);
                setSelectedItemId(null);
                // Always reload to refresh the carousel list
                window.location.reload();
              }}
            />
          ) : null
        )}
      </div>
    </main>
  );
}
