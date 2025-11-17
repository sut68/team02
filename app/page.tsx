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
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4 text-center">
        🎉 ยินดีต้อนรับสู่เว็บไซต์อย่างเป็นทางการ 🎉
      </h1>

        <p className="text-xl text-gray-600 mb-8 text-center max-w-3xl mx-auto">
          เราคือศูนย์กลางการระดมทุน การบริจาค และการแลกเปลี่ยนข้อมูลที่โปร่งใส
        </p>
      </div>
    </>
  );
}