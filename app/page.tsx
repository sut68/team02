import Link from 'next/link';
import React from 'react';
import { News } from './user/news/page';
import { cookies } from 'next/headers';

// นี่คือเนื้อหาหลักของหน้าแรก (Home Page)
export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ส่วนข่าวสารและกิจกรรม */}
      <News />
    </div>
  );
} 