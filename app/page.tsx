import Link from 'next/link';
import React from 'react';
import { News } from './user/news/page';
// นี่คือเนื้อหาหลักของหน้าแรก (Home Page)
export default function HomePage() {
  return (
    // container ที่จัดเนื้อหาให้อยู่ตรงกลางจอและมี padding
    // min-h-[calc(100vh-128px)] ใช้เพื่อรับประกันความสูงขั้นต่ำ 
    // โดยหักความสูงของ Navbar และ Footer ออก เพื่อให้เนื้อหามีที่ว่าง
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-128px)]">

      {/* 💡 เนื้อหาทักทาย */}

      <News />
    
    </div>

  );
} 