import Link from 'next/link';
import React from 'react';

// นี่คือเนื้อหาหลักของหน้าแรก (Home Page)
export default function HomePage() {
  return (
    // container ที่จัดเนื้อหาให้อยู่ตรงกลางจอและมี padding
    // min-h-[calc(100vh-128px)] ใช้เพื่อรับประกันความสูงขั้นต่ำ 
    // โดยหักความสูงของ Navbar และ Footer ออก เพื่อให้เนื้อหามีที่ว่าง
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-128px)]">

      {/* 💡 เนื้อหาทักทาย */}
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4 text-center">
        🎉 ยินดีต้อนรับสู่เว็บไซต์อย่างเป็นทางการ 🎉
      </h1>

      <p className="text-xl text-gray-600 mb-8 text-center max-w-3xl">
        เราคือศูนย์กลางการระดมทุน การบริจาค และการแลกเปลี่ยนข้อมูลที่โปร่งใส
        เพื่อสนับสนุนพันธกิจหลักของคณะวิศวกรรมศาสตร์
      </p>

      {/* 💡 ปุ่มตัวอย่าง */}
      <div className="space-x-20">
        <Link
          href="/content"
          // className="bg-[#F26522] text-white-800 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-300 transition duration-300"
          className="bg-[#F26522] text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-orange-700 transition duration-300"
          >
          เริ่มต้นระดมทุน
        </Link>
        <button className="bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-300 transition duration-300">
          ดูรายงานงบประมาณ
        </button>
      </div>

    </div>
  );
} 