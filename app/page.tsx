import Link from 'next/link';
import React from 'react';
import { News } from './user/news/page';
import { SouvenirSection } from './user/souvenir/SouvenirSection';

// นี่คือเนื้อหาหลักของหน้าแรก (Home Page)
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ส่วนข่าวสารและกิจกรรม */}
      <News />
      
      {/* ส่วนของที่ระลึก */}
      <SouvenirSection />
    </div>
  );
} 